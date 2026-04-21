import { Test, TestingModule } from '@nestjs/testing';
import { ParsedDocumentsController } from './parsed-documents.controller';

describe('ParsedDocumentsController', () => {
  let controller: ParsedDocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParsedDocumentsController],
    }).compile();

    controller = module.get<ParsedDocumentsController>(ParsedDocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
