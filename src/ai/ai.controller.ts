import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { type UIMessage } from 'ai';

@Controller('api/chat')
export class AiController {
  constructor(private readonly aiService: AiService) {}
  private readonly logger = new Logger(AiController.name);

  @Post()
  async chat(
    @Body('messages') messages: UIMessage[],
    @Body('dashboardState') dashboardState: any,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    try {
      const result = await this.aiService.chat(messages, dashboardState);
      result.pipeTextStreamToResponse(res);
    } catch (error) {
      this.logger.error(
        `❌ Error generating AI: ${(error as Error).message}`,
        (error as Error).stack,
      );
      res.status(500).end('An error occurred while accessing the AI.');
    }
  }
}
