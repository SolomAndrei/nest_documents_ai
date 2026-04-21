import { Injectable, Logger } from '@nestjs/common';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { ParsedDocumentsService } from '../parsed-documents/parsed-documents.service';
import type { StreamTextResult, UIMessage } from 'ai';

@Injectable()
export class AiService {
  constructor(private readonly documentsService: ParsedDocumentsService) {}
  private readonly logger = new Logger(AiService.name);

  private readonly SYSTEM_PROMPT = `You are an expert AI logistics and billing assistant.
Your primary role is to help the user manage, find, and analyze parsed documents (Invoices, RFQs, Waybills, etc.).

CRITICAL RULES:
1. NEVER guess or make up data. Always use the provided tools to fetch real information from the database.
2. If the user asks for analytical data (sums, groupings, averages), use the 'getAnalytics' tool.
3. If the user asks to find specific documents, use the 'searchDocuments' tool.
4. **GENERATIVE UI (Arrow.js)**: 
   If the user asks to SHOW data (like a table, list, or dashboard), you MUST generate a valid JavaScript component using Arrow.js.
   - Use this import: import { html, reactive } from 'https://esm.sh/@arrow-js/core';
   - Do NOT write plain text lists.
   - Wrap your Arrow.js code in \`\`\`javascript ... \`\`\` markdown blocks.
   - Use Tailwind CSS classes for styling (e.g., class="p-4 bg-white rounded shadow").
   - The code must be ready to run in the browser.
5. **DESIGN SYSTEM & BRAND GUIDELINES (CRITICAL)**:
   You MUST style all generated UI components using Tailwind CSS classes.
   You have creative freedom to design the layout, but you MUST STRICTLY adhere to this color palette:
   - **Primary Brand Color (Blue)**: Use ONLY the 'blue' palette for main actions, highlights, and active states (e.g., bg-blue-600, text-blue-500, border-blue-400, hover:bg-blue-700).
   - **Neutral/Background Colors (Slate)**: Use ONLY the 'slate' palette for backgrounds, borders, and text (e.g., bg-slate-50, text-slate-900, border-slate-200).
   - **Status Colors**:
     - Success/Paid: Use ONLY the 'emerald' palette (e.g., bg-emerald-100, text-emerald-700).
     - Warning/Pending: Use ONLY the 'amber' palette (e.g., bg-amber-100, text-amber-700).
     - Danger/Overdue/Error: Use ONLY the 'rose' palette (e.g., bg-rose-100, text-rose-700).
   NEVER use other colors like red, green, yellow, purple, indigo, or gray. Stick strictly to blue, slate, emerald, amber, and rose.
   Ensure high contrast and a clean, modern, professional look.
   6. **GRID SYSTEM (CRITICAL)**:
   The user's screen is divided into a CSS Grid with numbered cells (e.g., 1 to 12).
   When the user asks to add or change content in specific cells, you MUST use the 'updateGridCells' tool.
   DO NOT output the HTML directly in the chat. Send it through the tool.`;

  async chat(
    messages: UIMessage[],
    dashboardState?: any,
  ): Promise<StreamTextResult<any, any>> {
    let dynamicSystemPrompt = this.SYSTEM_PROMPT;
    if (dashboardState) {
      dynamicSystemPrompt += `\n\n--- CURRENT DASHBOARD STATE ---\n`;
      dynamicSystemPrompt += `The user's screen is currently configured as follows:\n`;
      dynamicSystemPrompt += JSON.stringify(dashboardState, null, 2);
      dynamicSystemPrompt += `\nWhen modifying the dashboard using the 'mutateDashboard' tool, you MUST take this current state into account. Do not place new widgets in cells that are already occupied unless you explicitly resize or remove the existing widgets first.`;
    }
    const result = streamText({
      model: openai('gpt-4o'),
      system: dynamicSystemPrompt,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
      tools: {
        searchDocuments: tool({
          description:
            'Search for documents in the database by specific criteria (e.g., documentType, status).',
          inputSchema: z.object({
            documentType: z
              .string()
              .optional()
              .describe('Type of document (e.g., Invoice, RFQ, Waybill)'),
            status: z
              .string()
              .optional()
              .describe('Status of the document (e.g., Pending, Paid)'),
          }),
          execute: async (args: { documentType?: string; status?: string }) => {
            this.logger.log(
              `🤖 AI is searching documents with args: ${JSON.stringify(args)}`,
            );
            try {
              const result = await this.documentsService.search(args);
              this.logger.log(
                `✅ Search complete. Found ${result.data.length} documents.`,
              );

              return result;
            } catch (error) {
              this.logger.error(
                `❌ Search failed: ${(error as Error).message}`,
              );
              throw error;
            }
          },
        }),
        getAnalytics: tool({
          description:
            'Get complex analytics (sums, counts, groupings) using MongoDB Aggregation Pipeline.',
          inputSchema: z
            .object({
              pipeline: z
                .array(z.any())
                .describe(
                  'A valid MongoDB aggregation pipeline array (e.g., [{ $match: ... }, { $group: ... }])',
                ),
            })
            .strict(),
          execute: async ({ pipeline }: { pipeline: any[] }) => {
            this.logger.log(`🤖 AI is running analytics pipeline`);
            this.logger.debug(
              `📥 Pipeline: ${JSON.stringify(pipeline, null, 2)}`,
            );
            try {
              const data = await this.documentsService.aggregate(pipeline);
              this.logger.log(
                `✅ Analytics complete. Returned ${data.length} rows.`,
              );
              if (data.length > 0) {
                this.logger.debug(
                  `📊 Analytics sample: ${JSON.stringify(data[0], null, 2)}`,
                );
              }
              return { data };
            } catch (error) {
              this.logger.error(
                `❌ Analytics failed: ${(error as Error).message}`,
              );
              throw error;
            }
          },
        }),
      },
    });
    return result;
  }
}
