import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JiraModule } from './jira/jira.module';
import { ExcelModule } from './excel/excel.module';
import { AgentModule } from './agent/agent.module';
import { RagModule } from './rag/rag.module';
import { McpService } from './common/mcp.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env', '../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DATABASE_URL') || 'data/jira_summarizer.db',
        autoLoadEntities: true,
        synchronize: true, // Be careful in production
      }),
      inject: [ConfigService],
    }),
    JiraModule,
    ExcelModule,
    AgentModule,
    RagModule,
  ],
  controllers: [AppController],
  providers: [AppService, McpService],
})
export class AppModule { }
