import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class JiraService {
    private readonly logger = new Logger(JiraService.name);
    private readonly host: string;
    private readonly auth: string;

    constructor(private configService: ConfigService) {
        this.host = this.configService.get<string>('JIRA_HOST') || '';
        const email = this.configService.get<string>('JIRA_EMAIL');
        const apiToken = this.configService.get<string>('JIRA_API_TOKEN');
        this.auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    }

    async getTickets(jql: string = 'order by created DESC') {
        try {
            const response = await axios.get(`${this.host}/rest/api/3/search`, {
                params: { jql, maxResults: 50 },
                headers: {
                    Authorization: `Basic ${this.auth}`,
                    Accept: 'application/json',
                },
            });
            return response.data.issues.map((issue: any) => ({
                key: issue.key,
                summary: issue.fields.summary,
                description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
                status: issue.fields.status.name,
                priority: issue.fields.priority.name,
                assignee: issue.fields.assignee?.displayName || 'Unassigned',
                created: issue.fields.created,
            }));
        } catch (error) {
            this.logger.error(`Failed to fetch tickets: ${error.message}`);
            throw error;
        }
    }

    async getTicketDetails(issueKey: string) {
        try {
            const response = await axios.get(`${this.host}/rest/api/3/issue/${issueKey}`, {
                headers: {
                    Authorization: `Basic ${this.auth}`,
                    Accept: 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch details for ${issueKey}: ${error.message}`);
            throw error;
        }
    }
}
