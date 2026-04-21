import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ParsedDocumentsModule } from '../parsed-documents/parsed-documents.module';

@Module({
  imports: [ParsedDocumentsModule],
  providers: [AiService],
  controllers: [AiController],
})
export class AiModule {}
