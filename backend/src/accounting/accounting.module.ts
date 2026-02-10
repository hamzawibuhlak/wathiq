import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AccountService } from './account.service';
import { JournalEntryService } from './journal-entry.service';
import { FinancialStatementsService } from './financial-statements.service';
import { ARService } from './ar.service';
import { APService } from './ap.service';
import { ExpenseService } from './expense.service';
import { BankService } from './bank.service';
import { BudgetService } from './budget.service';
import { AccountingController } from './accounting.controller';

@Module({
    imports: [PrismaModule],
    controllers: [AccountingController],
    providers: [
        AccountService,
        JournalEntryService,
        FinancialStatementsService,
        ARService,
        APService,
        ExpenseService,
        BankService,
        BudgetService,
    ],
    exports: [
        AccountService,
        JournalEntryService,
        FinancialStatementsService,
        ARService,
        APService,
    ],
})
export class AccountingModule { }
