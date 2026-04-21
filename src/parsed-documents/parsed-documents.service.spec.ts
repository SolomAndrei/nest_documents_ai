import { Test, TestingModule } from '@nestjs/testing';
import { ParsedDocumentsService } from './parsed-documents.service';

describe('ParsedDocumentsService', () => {
  let service: ParsedDocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParsedDocumentsService],
    }).compile();

    service = module.get<ParsedDocumentsService>(ParsedDocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
