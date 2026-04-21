import { Module } from '@nestjs/common';
import { ParsedDocumentsService } from './parsed-documents.service';
import { ParsedDocumentsController } from './parsed-documents.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ParsedDocument, ParsedDocumentSchema } from './parsed-document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParsedDocument.name, schema: ParsedDocumentSchema },
    ]),
  ],
  providers: [ParsedDocumentsService],
  controllers: [ParsedDocumentsController],
  exports: [ParsedDocumentsService],
})
export class ParsedDocumentsModule {}
