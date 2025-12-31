import { Controller, Post, Body, Get } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ConfigService } from '@nestjs/config';

@Controller('agent')
export class AgentController {
    constructor(
        private readonly agentService: AgentService,
        private readonly configService: ConfigService,
    ) { }

    @Post('summarize')
    async summarize(@Body() body: { query: string; images?: string[] }) {
        return this.agentService.runSummarizer(body.query, body.images);
    }

    @Get('config')
    async getConfig() {
        return {
            source: this.configService.get<string>('DATA_SOURCE', 'jira'),
            llm: this.configService.get<string>('PREFERRED_LLM', 'groq'),
        };
    }
}
