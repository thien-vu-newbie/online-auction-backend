import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub || payload.userId;
      client.data.userId = userId;
      this.userSockets.set(userId, client.id);

      this.logger.info('WebSocket connected', {
        context: 'ChatGateway',
        userId: userId,
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error('WebSocket connection rejected', {
        context: 'ChatGateway',
        error: error.message,
        stack: error.stack,
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.info('WebSocket disconnected', {
        context: 'ChatGateway',
        userId: userId,
        socketId: client.id,
      });
    }
  }

  @SubscribeMessage('joinProduct')
  async handleJoinProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { productId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      throw new WsException('Unauthorized');
    }

    client.join(`product_${data.productId}`);
    this.logger.debug('User joined product', {
      context: 'ChatGateway',
      userId: userId,
      productId: data.productId,
    });
    
    return { event: 'joinedProduct', data: { productId: data.productId } };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { productId: string; content: string },
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const message = await this.chatService.sendMessage(
        data.productId,
        userId,
        data.content,
      );

      this.server.to(`product_${data.productId}`).emit('newMessage', {
        _id: message._id,
        senderId: message.senderId,
        content: message.content,
        createdAt: message['createdAt'],
      });

      return { event: 'messageSent', data: { success: true } };
    } catch (error) {
      this.logger.error('Failed to send message', {
        context: 'ChatGateway',
        userId: client.data.userId,
        productId: data.productId,
        error: error.message,
        stack: error.stack,
      });
      return { event: 'error', data: { message: error.message } };
    }
  }
}
