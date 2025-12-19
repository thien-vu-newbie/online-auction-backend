import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '[BIDDER/SELLER] Đặt câu hỏi hoặc trả lời', 
    description: 'Người dùng đặt câu hỏi về sản phẩm (không có parentId) hoặc trả lời câu hỏi (có parentId). Seller nhận email khi có câu hỏi mới.' 
  })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parent comment or product not found' })
  @ApiResponse({ status: 404, description: 'Product or parent comment not found' })
  createComment(@Body() createCommentDto: CreateCommentDto, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.commentsService.createComment(createCommentDto, userId);
  }

  @Get('products/:productId')
  @ApiOperation({ 
    summary: '[PUBLIC] Xem tất cả comments của sản phẩm', 
    description: 'Hiển thị cây comments (câu hỏi và replies) theo cấu trúc phân cấp' 
  })
  @ApiResponse({ status: 200, description: 'Comments tree structure' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getCommentsByProduct(@Param('productId') productId: string) {
    return this.commentsService.getCommentsByProduct(productId);
  }
}
