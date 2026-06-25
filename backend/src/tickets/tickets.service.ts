import { Injectable, OnModuleInit, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class TicketsService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly MAX_SLOTS = 1000;
  // TTL shortened for simulation testing. User didn't specify shorter, but I'll use 900s (15 min) as per PRD, 
  // maybe make it configurable or just stick to 900 as per PRD. Let's stick to 900.
  private readonly SESSION_TTL = 900; 

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
    };
  }

  async resetPool() {
    const keys = await this.redis.keys('user_slot:*');
    const pipeline = this.redis.pipeline();
    keys.forEach(k => pipeline.del(k));
    pipeline.del('ticket_slots_counter');
    await pipeline.exec();
    return { success: true };
  }
}

