import { Injectable, OnModuleInit, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class TicketsService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private MAX_SLOTS = 1000;
  private readonly SESSION_TTL = 60; 
  private isBotSimulationRunning = false;
  private activeBotsCount = 0;
  private logs: string[] = [];

  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour12: false
    });
    this.logs.unshift(`[${timestamp}] ${message}`);
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
    
    // Define the Lua command using ZSET for automatic expiration
    this.redis.defineCommand('requestSlotAtomic', {
      numberOfKeys: 1,
      lua: `
        redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', tonumber(ARGV[2]))
        local current_count = redis.call('ZCARD', KEYS[1])
        if current_count >= tonumber(ARGV[1]) then
            return 0
        else
            redis.call('ZADD', KEYS[1], tonumber(ARGV[3]), ARGV[4])
            return 1
        end
      `,
    });
  }

  onModuleDestroy() {
    this.redis.quit();
  }

  async requestSlot(userId: string) {
    const sessionKey = `user_slot:${userId}`;
    const now = Date.now();
    
    // Clean up expired slots
    await this.redis.zremrangebyscore('active_ticket_slots', '-inf', now);
    
    // Check if user already has a slot
    const existingScore = await this.redis.zscore('active_ticket_slots', sessionKey);
    if (existingScore) {
      return { sessionToken: sessionKey, expiresInSeconds: this.SESSION_TTL, existing: true };
    }

    const expiresAt = now + (this.SESSION_TTL * 1000);
    // Execute Lua script
    // @ts-ignore
    const result = await this.redis.requestSlotAtomic('active_ticket_slots', this.MAX_SLOTS, now, expiresAt, sessionKey);
    
    if (result === 0) {
      throw new HttpException('Slot penuh, silakan coba beberapa saat lagi.', HttpStatus.TOO_MANY_REQUESTS);
    }
    
    this.addLog(`User session ***${userId.slice(-4)} reserved a slot.`);
    return { sessionToken: sessionKey, expiresInSeconds: this.SESSION_TTL, existing: false };
  }

  async releaseSlot(userId: string) {
    const sessionKey = `user_slot:${userId}`;
    await this.redis.zrem('active_ticket_slots', sessionKey);
    this.addLog(`User session ***${userId.slice(-4)} checked out and released slot.`);
    return { success: true };
  }

  async getCounter() {
    const now = Date.now();
    await this.redis.zremrangebyscore('active_ticket_slots', '-inf', now);
    const count = await this.redis.zcard('active_ticket_slots');
    return {
      currentCounter: count,
      maxSlots: this.MAX_SLOTS,
      isSimulationRunning: this.isBotSimulationRunning,
      activeBots: this.activeBotsCount,
      logs: this.logs
    };
  }

  async resetPool() {
    await this.redis.del('active_ticket_slots');
    
    // Clean up old keys just in case we are transitioning from the old system
    const keys = await this.redis.keys('user_slot:*');
    if (keys.length > 0) {
      const pipeline = this.redis.pipeline();
      keys.forEach(k => pipeline.del(k));
      await pipeline.exec();
    }
    await this.redis.del('ticket_slots_counter');
    
    this.addLog('System: Slot pool counter was forcibly reset.');
    return { success: true, message: 'Slot pool counter has been reset.' };
  }

  setMaxSlots(max: number) {
    this.MAX_SLOTS = max;
    this.addLog(`System: Max slots updated to ${max}.`);
    return { message: `Max slots successfully updated to ${max}.` };
  }

  async startBotSimulation(botCount: number) {
    if (this.isBotSimulationRunning) {
      return { message: 'Bot simulation is already running.' };
    }
    this.isBotSimulationRunning = true;
    for (let i = 0; i < botCount; i++) {
      this.simulateContinuousBot();
    }
    this.addLog(`System: Started traffic simulation.`);
    return { message: `Started continuous simulation with ${botCount} bots.` };
  }

  async stopBotSimulation() {
    this.isBotSimulationRunning = false;
    this.addLog('System: Stopping traffic simulation...');
    return { message: 'Stopping bots... They will finish their current wait cycles and terminate.' };
  }

  private async simulateContinuousBot() {
    this.activeBotsCount++;

    while (this.isBotSimulationRunning) {
      const botId = `bot_${Math.floor(Math.random() * 1000000)}_${Date.now()}`;
      
      try {
        // 1. Bot attempts to request a slot
        await this.requestSlot(botId);
        
        // 2. Wait randomly between 5 to 45 seconds
        const waitTime = Math.floor(Math.random() * 40000) + 5000;
        await new Promise(resolve => setTimeout(resolve, waitTime));

        if (!this.isBotSimulationRunning) {
          await this.releaseSlot(botId).catch(() => {});
          break;
        }

        // 3. Randomly decide to checkout (70% chance) or do nothing (30% chance - letting TTL expire)
        const shouldCheckout = Math.random() < 0.7;
        if (shouldCheckout) {
          await this.releaseSlot(botId);
        } else {
          this.addLog(`User session ***${botId.slice(-4)} abandoned the checkout.`);
        }
        
      } catch (error) {
        // Slot request failed (probably HTTP 429 Too Many Requests), wait a short time before retrying
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 1000));
      }
    }
    this.activeBotsCount--;
  }
}
