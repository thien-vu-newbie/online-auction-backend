import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @ApiOperation({ 
    summary: '[SELLER/WINNER] Gửi tin nhắn', 
    description: 'Gửi tin nhắn giữa seller và winner của sản phẩm' 
  })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 403, description: 'Only seller or winner can send messages' })
  async sendMessage(@Body() sendMessageDto: SendMessageDto, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.chatService.sendMessage(
      sendMessageDto.productId,
      userId,
      sendMessageDto.content,
    );
  }

  @Get('products/:productId/messages')
  @ApiOperation({ 
    summary: '[SELLER/WINNER] Xem lịch sử chat', 
    description: 'Lấy tất cả tin nhắn của sản phẩm (chỉ seller và winner)' 
  })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Only seller or winner can view messages' })
  async getMessages(@Param('productId') productId: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.chatService.getMessages(productId, userId);
  }
}
