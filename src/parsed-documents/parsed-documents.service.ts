import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { faker } from '@faker-js/faker';
import { ParsedDocument } from './parsed-document.schema';

@Injectable()
export class ParsedDocumentsService {
  constructor(
    @InjectModel(ParsedDocument.name)
    private documentModel: Model<ParsedDocument>,
  ) {}

  async seedDatabase() {
    try {
      await this.documentModel.deleteMany({});
      console.log('Old data deleted. Generating new data...');

      const mockDocuments: any[] = [];
      const docTypes = ['RFQ', 'Invoice', 'Waybill', 'Logward_Export'];
      const statuses = ['Pending', 'Processed', 'Rejected', 'Approved'];
      const sources = ['Email Parser', 'Logward API', 'Manual Upload'];

      for (let i = 0; i < 300; i++) {
        const docType = faker.helpers.arrayElement(docTypes);
        const baseDoc = {
          documentType: docType,
          status: faker.helpers.arrayElement(statuses),
          source: faker.helpers.arrayElement(sources),
          createdAt: faker.date.recent({ days: 30 }),
          fileName: faker.system.fileName() + '.pdf',
        };

        let payload = {};

        if (docType === 'RFQ') {
          payload = {
            requestRef: `RFQ-${faker.string.alphanumeric(8).toUpperCase()}`,
            urgency: faker.helpers.arrayElement(['Low', 'Normal', 'Critical']),
            dateIssued: faker.date.recent({ days: 10 }),
            deadline: faker.date.soon({ days: 15 }),
            buyer: {
              company: faker.company.name(),
              contactPerson: faker.person.fullName(),
              email: faker.internet.email(),
              phone: faker.phone.number(),
            },
            shipping: {
              incoterms: faker.helpers.arrayElement([
                'FOB',
                'CIF',
                'EXW',
                'DDP',
              ]),
              destination: {
                country: faker.location.country(),
                city: faker.location.city(),
                address: faker.location.streetAddress(),
              },
              expectedDelivery: faker.date.future({ years: 0.2 }),
            },
            items: Array.from({
              length: faker.number.int({ min: 1, max: 10 }),
            }).map(() => ({
              partNumber: faker.string.alphanumeric(8).toUpperCase(),
              description: faker.commerce.productDescription(),
              quantity: faker.number.int({ min: 10, max: 1000 }),
              unit: faker.helpers.arrayElement([
                'pcs',
                'kg',
                'liters',
                'boxes',
              ]),
              targetPrice: parseFloat(
                faker.finance.amount({ min: 5, max: 500, dec: 2 }),
              ),
            })),
            termsAndConditions: faker.lorem.paragraph(),
          };
        } else if (docType === 'Invoice') {
          const itemsCount = faker.number.int({ min: 1, max: 15 });
          const items = Array.from({ length: itemsCount }).map(() => {
            const qty = faker.number.int({ min: 1, max: 50 });
            const unitPrice = parseFloat(
              faker.finance.amount({ min: 10, max: 1000, dec: 2 }),
            );
            return {
              description: faker.commerce.productName(),
              quantity: qty,
              unitPrice: unitPrice,
              taxRate: faker.helpers.arrayElement([0, 0.1, 0.2]),
              total: parseFloat((qty * unitPrice).toFixed(2)),
            };
          });

          const subtotal = items.reduce((sum, item) => sum + item.total, 0);
          const taxTotal = items.reduce(
            (sum, item) => sum + item.total * item.taxRate,
            0,
          );

          payload = {
            invoiceNumber: `INV-${faker.string.numeric(6)}`,
            issueDate: faker.date.recent({ days: 30 }),
            dueDate: faker.date.soon({ days: 30 }),
            currency: faker.finance.currencyCode(),
            vendor: {
              name: faker.company.name(),
              taxId: faker.string.alphanumeric(10).toUpperCase(),
              address: faker.location.streetAddress({ useFullAddress: true }),
            },
            customer: {
              name: faker.company.name(),
              address: faker.location.streetAddress({ useFullAddress: true }),
            },
            lineItems: items,
            summary: {
              subtotal: parseFloat(subtotal.toFixed(2)),
              taxTotal: parseFloat(taxTotal.toFixed(2)),
              grandTotal: parseFloat((subtotal + taxTotal).toFixed(2)),
            },
            paymentStatus: faker.helpers.arrayElement([
              'Paid',
              'Unpaid',
              'Overdue',
            ]),
          };
        } else if (docType === 'Waybill') {
          payload = {
            waybillNumber: `AWB-${faker.string.numeric(3)}-${faker.string.numeric(8)}`,
            carrier: faker.company.name() + ' Airlines',
            shipper: {
              name: faker.company.name(),
              address: faker.location.streetAddress({ useFullAddress: true }),
              country: faker.location.country(),
            },
            consignee: {
              name: faker.company.name(),
              address: faker.location.streetAddress({ useFullAddress: true }),
              country: faker.location.country(),
            },
            routing: {
              originPort: faker.location.city() + ' Port',
              destinationPort: faker.location.city() + ' Port',
              flightOrVoyageNumber: faker.string.alphanumeric(6).toUpperCase(),
              departureDate: faker.date.recent({ days: 5 }),
              arrivalDate: faker.date.soon({ days: 10 }),
            },
            cargo: {
              totalPieces: faker.number.int({ min: 1, max: 200 }),
              grossWeightKg: faker.number.float({
                min: 50,
                max: 10000,
                fractionDigits: 2,
              }),
              chargeableWeightKg: faker.number.float({
                min: 50,
                max: 10500,
                fractionDigits: 2,
              }),
              volumeCbm: faker.number.float({
                min: 1,
                max: 50,
                fractionDigits: 2,
              }),
              description: faker.commerce.productMaterial() + ' goods',
              specialInstructions: faker.helpers.arrayElement([
                'Handle with care',
                'Keep dry',
                'Temperature controlled',
                'None',
              ]),
            },
          };
        } else if (docType === 'Logward_Export') {
          payload = {
            exportId: `EXP-${faker.string.uuid().substring(0, 8).toUpperCase()}`,
            bookingReference: faker.string.alphanumeric(10).toUpperCase(),
            vessel: {
              name: faker.vehicle.vehicle(),
              imoNumber: faker.string.numeric(7),
              flag: faker.location.country(),
            },
            containers: Array.from({
              length: faker.number.int({ min: 1, max: 5 }),
            }).map(() => ({
              containerNumber: `${faker.string.alpha(4).toUpperCase()}${faker.string.numeric(7)}`,
              type: faker.helpers.arrayElement([
                '20GP',
                '40HC',
                '40REEFER',
                '20OT',
              ]),
              sealNumber: faker.string.alphanumeric(8).toUpperCase(),
              payloadWeightKg: faker.number.float({
                min: 5000,
                max: 28000,
                fractionDigits: 2,
              }),
              tareWeightKg: faker.number.float({
                min: 2000,
                max: 4000,
                fractionDigits: 2,
              }),
            })),
            customs: {
              declarationNumber: faker.string.numeric(14),
              clearanceDate: faker.date.recent({ days: 2 }),
              status: faker.helpers.arrayElement([
                'Cleared',
                'Pending',
                'Inspected',
              ]),
            },
            milestones: [
              {
                event: 'Gate In',
                date: faker.date.recent({ days: 10 }),
                location: faker.location.city(),
              },
              {
                event: 'Loaded on Vessel',
                date: faker.date.recent({ days: 5 }),
                location: faker.location.city(),
              },
              {
                event: 'Vessel Departed',
                date: faker.date.recent({ days: 2 }),
                location: faker.location.city(),
              },
            ],
          };
        }

        mockDocuments.push({ ...baseDoc, payload });
      }

      const result = await this.documentModel.insertMany(mockDocuments);
      console.log(`Successfully added ${result.length} documents!`);

      return {
        success: true,
        message: `Successfully added ${result.length} documents!`,
      };
    } catch (error) {
      console.error('Error adding data:', error);
      return {
        success: false,
        message: 'Error adding data:',
        error: (error as Error).message || 'Unknown error',
      };
    }
  }
  async findAll() {
    const documents = await this.documentModel
      .find()
      .select('-payload')
      .sort({ createdAt: -1 })
      .exec();

    return {
      success: true,
      data: documents,
    };
  }
  async countByType(documentType: string) {
    if (!documentType || documentType.trim() === '') {
      throw new BadRequestException(
        'You need to pass the document type (documentType)',
      );
    }
    const existingTypes = await this.documentModel
      .distinct('documentType')
      .exec();

    if (!existingTypes.includes(documentType)) {
      throw new NotFoundException(`Document type ${documentType} not found`);
    }

    const count = await this.documentModel
      .countDocuments({ documentType })
      .exec();

    return { success: true, documentType, count };
  }
  async findById(id: string) {
    if (!id || id.trim() === '') {
      throw new BadRequestException('You need to pass the document id (id)');
    }
    const document = await this.documentModel.findById(id).exec();
    if (!document) {
      throw new NotFoundException(`Document with id ${id} not found`);
    }
    return { success: true, data: document };
  }
  async search(criteria: Record<string, unknown>) {
    if (!criteria || Object.keys(criteria).length === 0) {
      throw new BadRequestException(
        'You need to pass the search criteria in the request body. ' +
          'Example: { "documentType": "RFQ", "payload.urgency": "Critical" }',
      );
    }
    const parsedCriteria: Record<string, any> = {};
    for (const [key, value] of Object.entries(criteria)) {
      if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (trimmedValue.toLowerCase() === 'true') {
          parsedCriteria[key] = true;
          continue;
        }
        if (trimmedValue.toLowerCase() === 'false') {
          parsedCriteria[key] = false;
          continue;
        }
        if (trimmedValue !== '' && !isNaN(Number(trimmedValue))) {
          parsedCriteria[key] = Number(trimmedValue);
          continue;
        }
        parsedCriteria[key] = trimmedValue;
      } else {
        parsedCriteria[key] = value;
      }
    }
    const documents = await this.documentModel
      .find(parsedCriteria)
      .sort({ createdAt: -1 })
      .exec();
    return { success: true, data: documents };
  }
  async aggregate(pipeline: PipelineStage[]) {
    if (!pipeline || !Array.isArray(pipeline) || !pipeline.length) {
      throw new Error(
        'Pipeline must be a non-empty array of MongoDB aggregation stages',
      );
    }
    const forbiddenStages = ['$out', '$merge', '$lookup'];
    const hasForbiddenStage = pipeline.some((stage: PipelineStage) => {
      if (!stage || typeof stage !== 'object') return false;
      const stageName = Object.keys(stage)[0];
      return forbiddenStages.includes(stageName);
    });
    if (hasForbiddenStage) {
      throw new Error(
        'Pipeline contains forbidden stages (e.g., $out or $merge)',
      );
    }
    return this.documentModel.aggregate(pipeline).exec();
  }
}
