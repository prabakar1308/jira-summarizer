import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { JiraService } from '../jira/jira.service';
import { ExcelService } from '../excel/excel.service';
import { RagService } from '../rag/rag.service';
import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';

const AgentStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    tickets: Annotation<any[]>({
        reducer: (x, y) => y,
        default: () => [],
    }),
    summary: Annotation<string>({
        reducer: (x, y) => y,
        default: () => '',
    }),
    source: Annotation<any>({
        reducer: (x, y) => y,
        default: () => 'jira',
    }),
    query: Annotation<string>({
        reducer: (x, y) => y,
        default: () => '',
    }),
});

@Injectable()
export class AgentService {
    private readonly logger = new Logger(AgentService.name);

    constructor(
        private configService: ConfigService,
        private jiraService: JiraService,
        private excelService: ExcelService,
        private ragService: RagService,
    ) { }

    private getModel() {
        const preferredModel = this.configService.get<string>('PREFERRED_LLM', 'groq');

        if (preferredModel === 'groq') {
            return new ChatGroq({
                apiKey: this.configService.get<string>('GROQ_API_KEY') || '',
                model: 'llama-3.3-70b-versatile',
            });
        }

        // Using any cast to bypass nested type issues with Azure versions
        return new AzureChatOpenAI({
            azureOpenAIApiKey: this.configService.get<string>('AZURE_OPENAI_API_KEY') || '',
            azureOpenAIApiInstanceName: this.configService.get<string>('AZURE_OPENAI_ENDPOINT') || '',
            azureOpenAIApiDeploymentName: this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT_NAME') || '',
            apiVersion: '2023-05-15',
        } as any);
    }

    async runSummarizer(query: string, images?: string[]) {
        const workflow = new StateGraph(AgentStateAnnotation)
            .addNode('fetch_data', async (state) => {
                this.logger.log(`Fetching data from ${state.source}`);
                let tickets: any[] = [];
                if (state.source === 'jira') {
                    tickets = await this.jiraService.getTickets();
                } else {
                    tickets = await this.excelService.getTickets();
                }
                return { tickets };
            })
            .addNode('summarize', async (state) => {
                const model = this.getModel();

                let contextMessage = '';
                if (state.tickets && state.tickets.length > 0) {
                    const ticketContext = state.tickets
                        .map((t) => JSON.stringify(t))
                        .join('\n');
                    contextMessage = `CURRENT ${state.source.toUpperCase()} CONTEXT:\n${ticketContext}\n\n`;
                } else {
                    contextMessage = `(Note: No specific Jira tickets were found in the current context. If this is a general question, please answer normally. If it requires Jira data, provide a professional response explaining the current status.)\n\n`;
                }

                const content: any[] = [
                    { type: 'text', text: `${contextMessage}USER REQUEST: ${state.query}` }
                ];

                if (images && images.length > 0) {
                    images.forEach(img => {
                        content.push({
                            type: 'image_url',
                            image_url: { url: img }
                        });
                    });
                }

                const response = await model.invoke([
                    new SystemMessage(`You are JiraAgent AI, a high-performance analysis engine. 
                        Your goal is to provide intelligent insights based on the provided context data (could be from Jira or Excel) when available, or engage in general professional conversation when asked.
                        - If the user greets you or asks "who are you", respond as JiraAgent AI.
                        - If data is provided in the context, use all available fields to answer the user request accurately.
                        - Use markdown for your responses. 
                        - **CRITICAL: Always provide ticket details in an ordered list format. NEVER use tables.**
                        - **CRITICAL: For each ticket in the list, keep it concise by including only the essential fields: Key, Summary, Status, Priority, and Assignee by default.**
                        - Maintain a premium, professional, and helpful tone.`),
                    new HumanMessage({ content }),
                ]);

                return { summary: response.content as string };
            })
            .addEdge(START, 'fetch_data')
            .addEdge('fetch_data', 'summarize')
            .addEdge('summarize', END);

        const app = workflow.compile();
        const result = await app.invoke({
            query,
            messages: [],
            source: this.configService.get('DATA_SOURCE', 'jira')
        });
        return result;
    }
}
