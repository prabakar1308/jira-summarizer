import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagService } from './rag.service';
import { TicketRecord } from './ticket.entity';
import { RagController } from './rag.controller';
import { JiraModule } from '../jira/jira.module';
import { ExcelModule } from '../excel/excel.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TicketRecord]),
        JiraModule,
        ExcelModule,
    ],
    controllers: [RagController],
    providers: [RagService],
    exports: [RagService],
})
export class RagModule { }
