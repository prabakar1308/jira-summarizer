import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AgentService } from '../agent/agent.service';

@Injectable()
export class McpService implements OnModuleInit {
    private readonly logger = new Logger(McpService.name);
    private server: Server;

    constructor(private agentService: AgentService) {
        this.server = new Server(
            {
                name: 'jira-summarizer-mcp',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
    }

    async onModuleInit() {
        this.setupTools();
        // In a real production scenario, you'd connect this to a transport.
        // For local usage/demo, we can skip or use Stdio if running as a standalone process.
        this.logger.log('MCP Service initialized with Jira tools');
    }

    private setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'summarize_jira',
                    description: 'Summarize Jira tickets based on a query',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: { type: 'string', description: 'What to summarize or analyze' },
                        },
                        required: ['query'],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name === 'summarize_jira') {
                const query = (request.params.arguments as any).query;
                const result = await this.agentService.runSummarizer(query);
                return {
                    content: [{ type: 'text', text: result.summary }],
                };
            }
            throw new Error(`Tool not found: ${request.params.name}`);
        });
    }

    async connect() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.log('MCP Server connected via Stdio');
    }
}
