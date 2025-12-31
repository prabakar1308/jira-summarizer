import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { JiraModule } from '../jira/jira.module';
import { ExcelModule } from '../excel/excel.module';
import { RagModule } from '../rag/rag.module';
import { AgentController } from './agent.controller';

@Module({
    imports: [JiraModule, ExcelModule, RagModule],
    providers: [AgentService],
    controllers: [AgentController],
    exports: [AgentService],
})
export class AgentModule { }
