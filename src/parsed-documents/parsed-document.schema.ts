import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ParsedDocumentDocument = HydratedDocument<ParsedDocument>;

@Schema({ collection: 'parsed_documents', strict: false })
export class ParsedDocument {}
export const ParsedDocumentSchema =
  SchemaFactory.createForClass(ParsedDocument);
