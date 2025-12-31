import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagService } from './rag.service';
import { TicketRecord } from './ticket.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TicketRecord])],
    providers: [RagService],
    exports: [RagService],
})
export class RagModule { }
