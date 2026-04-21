import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ParsedDocumentsService } from './parsed-documents.service';
import { SearchDocumentDto } from './dto/search-document.dto';

@Controller('parsed-documents')
export class ParsedDocumentsController {
  constructor(
    private readonly parsedDocumentsService: ParsedDocumentsService,
  ) {}
  @Get('seed')
  async seed() {
    return this.parsedDocumentsService.seedDatabase();
  }
  @Get()
  async findAll() {
    return this.parsedDocumentsService.findAll();
  }
  @Get('count/:documentType')
  async countByType(@Param('documentType') documentType: string) {
    return this.parsedDocumentsService.countByType(documentType);
  }
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.parsedDocumentsService.findById(id);
  }
  @Post('search')
  async search(@Body() searchByDto: SearchDocumentDto) {
    return this.parsedDocumentsService.search(searchByDto.criteria || {});
  }
}
