import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { TicketRecord } from './ticket.entity';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import * as sqliteVec from 'sqlite-vec';
import * as Database from 'better-sqlite3';

@Injectable()
export class RagService implements OnModuleInit {
    private readonly logger = new Logger(RagService.name);
    private embeddings: OpenAIEmbeddings;
    private db: any;

    constructor(
        @InjectRepository(TicketRecord)
        private ticketRepository: Repository<TicketRecord>,
        private configService: ConfigService,
        private dataSource: DataSource,
    ) {
        // For Azure OpenAI, we need to pass the configuration correctly
        // or use AzureOpenAIEmbeddings if available.
        // We will use OpenAIEmbeddings with azure params cast to any to handle type mismatch if needed.
        const azureKey = this.configService.get<string>('AZURE_OPENAI_API_KEY');
        const azureEndpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT');
        const azureDeployment = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT_NAME') || 'text-embedding-ada-002';

        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: azureKey,
            configuration: {
                baseURL: `${azureEndpoint}/openai/deployments/${azureDeployment}`,
                defaultQuery: { 'api-version': '2023-05-15' },
                defaultHeaders: { 'api-key': azureKey },
            },
        } as any);
    }

    async onModuleInit() {
        try {
            const dbPath = this.configService.get<string>('DATABASE_URL') || 'data/jira_summarizer.db';
            this.db = new (Database as any)(dbPath);
            sqliteVec.load(this.db);

            this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS vec_tickets USING vec0(
          id INTEGER PRIMARY KEY,
          embedding FLOAT[1536]
        );
      `);
            this.logger.log('sqlite-vec extension loaded and virtual table initialized');
        } catch (error) {
            this.logger.error(`Failed to initialize sqlite-vec: ${error.message}`);
        }
    }

    async indexTicket(ticket: any) {
        const textToEmbed = `${ticket.summary} ${ticket.description}`;
        const embedding = await this.embeddings.embedQuery(textToEmbed);

        const record = this.ticketRepository.create({
            ...ticket,
            embedding,
            metadata: JSON.stringify({ source: this.configService.get('DATA_SOURCE') }),
        });

        const saved: any = await this.ticketRepository.save(record);

        // Sync to vector table
        try {
            this.db.prepare('INSERT OR REPLACE INTO vec_tickets(id, embedding) VALUES (?, ?)')
                .run(saved.id, new Float32Array(embedding));
        } catch (error) {
            this.logger.error(`Failed to sync to vector table: ${error.message}`);
        }

        return saved;
    }

    async searchSimilarTickets(query: string, limit: number = 5) {
        try {
            const queryEmbedding = await this.embeddings.embedQuery(query);

            const results = this.db.prepare(`
        SELECT 
          id,
          distance
        FROM vec_tickets
        WHERE embedding MATCH ?
        ORDER BY distance
        LIMIT ?
      `).all(new Float32Array(queryEmbedding), limit);

            if (results.length === 0) return [];

            const ids = results.map(r => r.id);
            return this.ticketRepository.find({
                where: { id: In(ids) }
            });
        } catch (error) {
            this.logger.error(`Search failed: ${error.message}`);
            return [];
        }
    }
}
