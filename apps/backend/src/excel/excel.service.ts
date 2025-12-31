import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as xlsx from 'xlsx';
import * as fs from 'fs';

@Injectable()
export class ExcelService {
    private readonly logger = new Logger(ExcelService.name);

    constructor(private configService: ConfigService) { }

    async getTickets() {
        const filePath = this.configService.get<string>('EXCEL_FILE_PATH') || '';
        if (!filePath || !fs.existsSync(filePath)) {
            this.logger.warn(`Excel file not found at ${filePath}`);
            return [];
        }

        try {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            return data;
        } catch (error) {
            this.logger.error(`Failed to read Excel file: ${error.message}`);
            throw error;
        }
    }
}
