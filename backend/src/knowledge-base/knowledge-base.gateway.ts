import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class KnowledgeBaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(KnowledgeBaseGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to KnowledgeBaseGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected from KnowledgeBaseGateway: ${client.id}`,
    );
  }

  @OnEvent('kb.processing.update')
  handleProcessingUpdate(payload: any) {
    this.logger.debug(
      `Sending processing update via WebSocket: ${payload.documentId} - ${payload.progress}%`,
    );
    this.server.emit('processing:update', payload);
  }
}
