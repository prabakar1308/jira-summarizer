import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { RagService } from './rag.service';
import { JiraService } from '../jira/jira.service';
import { ExcelService } from '../excel/excel.service';
import { ConfigService } from '@nestjs/config';

@Controller('rag')
export class RagController {
    constructor(
        private readonly ragService: RagService,
        private readonly jiraService: JiraService,
        private readonly excelService: ExcelService,
        private readonly configService: ConfigService,
    ) { }

    @Post('sync')
    async syncTickets() {
        const source = this.configService.get('DATA_SOURCE', 'jira');
        let tickets: any[] = [];

        if (source === 'jira') {
            tickets = await this.jiraService.getTickets();
        } else {
            tickets = await this.excelService.getTickets();
        }

        const results: any[] = [];
        for (const ticket of tickets) {
            const indexed = await this.ragService.indexTicket(ticket);
            results.push(indexed);
        }

        return {
            message: `Successfully indexed ${results.length} tickets from ${source}`,
            count: results.length,
        };
    }

    @Get('search')
    async search(@Query('query') query: string) {
        if (!query) {
            return { message: 'Query parameter is required', results: [] };
        }
        const results = await this.ragService.searchSimilarTickets(query);
        return {
            query,
            results,
        };
    }
}
