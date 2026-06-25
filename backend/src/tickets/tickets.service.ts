import { Injectable, OnModuleInit, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class TicketsService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private MAX_SLOTS = 1000;
  private readonly SESSION_TTL = 60; 
  private isBotSimulationRunning = false;
  private activeBotsCount = 0;

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
    
    // Define the Lua command
    this.redis.defineCommand('requestSlot', {
      numberOfKeys: 1,
      lua: `
        local current = redis.call('GET', KEYS[1])
        if current and tonumber(current) >= tonumber(ARGV[1]) then
            return 0
        else
            redis.call('INCR', KEYS[1])
            redis.call('SET', ARGV[2], 'ACTIVE', 'EX', tonumber(ARGV[3]))
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
    
    // Check if user already has a slot
    const existing = await this.redis.get(sessionKey);
    if (existing) {
      return { sessionToken: sessionKey, expiresInSeconds: this.SESSION_TTL, existing: true };
    }

    // Execute Lua script
    // @ts-ignore
    const result = await this.redis.requestSlot('ticket_slots_counter', this.MAX_SLOTS, sessionKey, this.SESSION_TTL);
    
    if (result === 0) {
      throw new HttpException('Slot penuh, silakan coba beberapa saat lagi.', HttpStatus.TOO_MANY_REQUESTS);
    }
    
    return { sessionToken: sessionKey, expiresInSeconds: this.SESSION_TTL, existing: false };
  }

  async releaseSlot(userId: string) {
    const sessionKey = `user_slot:${userId}`;
    
    // Use MULTI to atomically delete key and decrement counter
    const exists = await this.redis.exists(sessionKey);
    if (exists) {
      await this.redis.multi()
        .del(sessionKey)
        .decr('ticket_slots_counter')
        .exec();
    }
    return { success: true };
  }

  async getCounter() {
    const count = await this.redis.get('ticket_slots_counter');
    return {
      currentCounter: count ? parseInt(count) : 0,
      maxSlots: this.MAX_SLOTS,
      isSimulationRunning: this.isBotSimulationRunning,
      activeBots: this.activeBotsCount
    };
  }

  async resetPool() {
    const keys = await this.redis.keys('user_slot:*');
    const pipeline = this.redis.pipeline();
    keys.forEach(k => pipeline.del(k));
    pipeline.del('ticket_slots_counter');
    await pipeline.exec();
    return { success: true, message: 'Slot pool counter has been reset.' };
  }

  setMaxSlots(max: number) {
    this.MAX_SLOTS = max;
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
    return { message: `Started continuous simulation with ${botCount} bots.` };
  }

  async stopBotSimulation() {
    this.isBotSimulationRunning = false;
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
        }
        
      } catch (error) {
        // Slot request failed (probably HTTP 429 Too Many Requests), wait a short time before retrying
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 1000));
      }
    }
    this.activeBotsCount--;
  }
}

