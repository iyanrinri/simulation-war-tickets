import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { RequestSlotDto } from './dto/request-slot.dto';

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('request-slot')
  @HttpCode(HttpStatus.OK) // PRD mentions 201/200, let's use 200 OK
  async requestSlot(@Body() requestSlotDto: RequestSlotDto) {
    const data = await this.ticketsService.requestSlot(requestSlotDto.userId);
    return {
      success: true,
      message: data.existing ? "Slot already secured." : "Slot secured successfully.",
      data: {
        sessionToken: data.sessionToken,
        expiresInSeconds: data.expiresInSeconds,
      }
    };
  }

  @Post('release-slot')
  @HttpCode(HttpStatus.OK)
  async releaseSlot(@Body() requestSlotDto: RequestSlotDto) {
    await this.ticketsService.releaseSlot(requestSlotDto.userId);
    return {
      success: true,
      message: "Slot released successfully."
    };
  }

  @Get('slot-counter')
  async getSlotCounter() {
    const data = await this.ticketsService.getCounter();
    return {
      success: true,
      data
    };
  }

  @Post('reset-pool')
  @HttpCode(HttpStatus.OK)
  async resetPool() {
    await this.ticketsService.resetPool();
    return {
      success: true,
      message: "Slot pool has been reset to 0."
    };
  }
}
