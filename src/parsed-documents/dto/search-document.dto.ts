import { IsOptional, IsObject } from 'class-validator';

export class SearchDocumentDto {
  @IsOptional()
  @IsObject({
    message: 'Search parameters must be passed as a JSON object',
  })
  criteria?: Record<string, unknown>;
}
