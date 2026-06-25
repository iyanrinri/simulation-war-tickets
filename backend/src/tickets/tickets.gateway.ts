import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TicketsService } from './tickets.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class TicketsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly ticketsService: TicketsService) {}

  afterInit() {
    // Broadcast counter every 200ms
    setInterval(async () => {
      const data = await this.ticketsService.getCounter();
      this.server.emit('counterUpdate', data);
    }, 200);
  }
}
