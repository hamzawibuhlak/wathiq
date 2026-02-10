import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountService } from './account.service';
import { JournalEntryService } from './journal-entry.service';
import { FinancialStatementsService } from './financial-statements.service';
import { ARService } from './ar.service';
import { APService } from './ap.service';
import { ExpenseService } from './expense.service';
import { BankService } from './bank.service';
import { BudgetService } from './budget.service';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
    constructor(
        private accountService: AccountService,
        private journalEntryService: JournalEntryService,
        private financialStatementsService: FinancialStatementsService,
        private arService: ARService,
        private apService: APService,
        private expenseService: ExpenseService,
        private bankService: BankService,
        private budgetService: BudgetService,
    ) { }

    // ===== ACCOUNTS =====
    @Get('accounts')
    getAccounts(@Request() req: any, @Query('type') type?: string) {
        return this.accountService.findAll(req.user.tenantId, { type });
    }

    @Get('accounts/hierarchy')
    getAccountsHierarchy(@Request() req: any) {
        return this.accountService.getHierarchy(req.user.tenantId);
    }

    @Post('accounts')
    createAccount(@Request() req: any, @Body() dto: any) {
        return this.accountService.create(req.user.tenantId, dto);
    }

    @Patch('accounts/:id')
    updateAccount(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.accountService.update(req.user.tenantId, id, dto);
    }

    @Post('accounts/seed')
    seedAccounts(@Request() req: any) {
        return this.accountService.seedDefaultAccounts(req.user.tenantId);
    }

    @Get('accounts/:id/balance')
    getAccountBalance(@Request() req: any, @Param('id') id: string) {
        return this.accountService.getBalance(req.user.tenantId, id);
    }

    // ===== JOURNAL ENTRIES =====
    @Get('journal-entries')
    getJournalEntries(@Request() req: any, @Query('status') status?: string, @Query('page') page?: string) {
        return this.journalEntryService.findAll(req.user.tenantId, {
            status, page: page ? parseInt(page) : 1,
        });
    }

    @Get('journal-entries/:id')
    getJournalEntry(@Request() req: any, @Param('id') id: string) {
        return this.journalEntryService.findOne(id, req.user.tenantId);
    }

    @Post('journal-entries')
    createJournalEntry(@Request() req: any, @Body() dto: any) {
        return this.journalEntryService.create(req.user.tenantId, req.user.id, {
            ...dto, date: new Date(dto.date),
        });
    }

    @Post('journal-entries/:id/approve')
    approveJournalEntry(@Request() req: any, @Param('id') id: string) {
        return this.journalEntryService.approve(id, req.user.id, req.user.tenantId);
    }

    @Post('journal-entries/:id/post')
    postJournalEntry(@Request() req: any, @Param('id') id: string) {
        return this.journalEntryService.post(id, req.user.id, req.user.tenantId);
    }

    @Post('journal-entries/:id/reverse')
    reverseJournalEntry(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
        return this.journalEntryService.reverse(id, req.user.id, req.user.tenantId, reason);
    }

    @Post('journal-entries/from-invoice')
    createJEFromInvoice(@Request() req: any, @Body('invoiceId') invoiceId: string) {
        return this.journalEntryService.createFromInvoice(invoiceId, req.user.tenantId);
    }

    // ===== GENERAL LEDGER =====
    @Get('ledger/:accountId')
    getGeneralLedger(@Request() req: any, @Param('accountId') accountId: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
        return this.journalEntryService.getGeneralLedger(
            req.user.tenantId, accountId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('trial-balance')
    getTrialBalance(@Request() req: any, @Query('date') date?: string) {
        return this.journalEntryService.getTrialBalance(req.user.tenantId, date ? new Date(date) : new Date());
    }

    // ===== FINANCIAL STATEMENTS =====
    @Get('statements/income')
    getIncomeStatement(@Request() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.financialStatementsService.getIncomeStatement(req.user.tenantId, new Date(startDate), new Date(endDate));
    }

    @Get('statements/balance-sheet')
    getBalanceSheet(@Request() req: any, @Query('date') date?: string) {
        return this.financialStatementsService.getBalanceSheet(req.user.tenantId, date ? new Date(date) : new Date());
    }

    @Get('statements/cash-flow')
    getCashFlow(@Request() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.financialStatementsService.getCashFlowStatement(req.user.tenantId, new Date(startDate), new Date(endDate));
    }

    @Get('statements/ratios')
    getFinancialRatios(@Request() req: any, @Query('date') date?: string) {
        return this.financialStatementsService.getFinancialRatios(req.user.tenantId, date ? new Date(date) : new Date());
    }

    @Get('statements/vat')
    getVATReport(@Request() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.financialStatementsService.getVATReport(req.user.tenantId, new Date(startDate), new Date(endDate));
    }

    // ===== ACCOUNTS RECEIVABLE =====
    @Get('ar')
    getAR(@Request() req: any) {
        return this.arService.findAll(req.user.tenantId);
    }

    @Get('ar/aging')
    getARAgingReport(@Request() req: any) {
        return this.arService.getAgingReport(req.user.tenantId);
    }

    @Post('ar/from-invoice')
    createARFromInvoice(@Request() req: any, @Body('invoiceId') invoiceId: string) {
        return this.arService.createFromInvoice(req.user.tenantId, invoiceId);
    }

    @Post('ar/:id/payment')
    recordARPayment(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.arService.recordPayment(req.user.tenantId, id, { ...dto, paymentDate: new Date(dto.paymentDate) });
    }

    // ===== ACCOUNTS PAYABLE =====
    @Get('vendors')
    getVendors(@Request() req: any) {
        return this.apService.getVendors(req.user.tenantId);
    }

    @Post('vendors')
    createVendor(@Request() req: any, @Body() dto: any) {
        return this.apService.createVendor(req.user.tenantId, dto);
    }

    @Patch('vendors/:id')
    updateVendor(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.apService.updateVendor(req.user.tenantId, id, dto);
    }

    @Get('ap')
    getAP(@Request() req: any) {
        return this.apService.findAllBills(req.user.tenantId);
    }

    @Get('ap/aging')
    getAPAging(@Request() req: any) {
        return this.apService.getAgingReport(req.user.tenantId);
    }

    @Post('ap')
    createBill(@Request() req: any, @Body() dto: any) {
        return this.apService.createBill(req.user.tenantId, { ...dto, billDate: new Date(dto.billDate), dueDate: new Date(dto.dueDate) });
    }

    @Post('ap/:id/payment')
    recordAPPayment(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.apService.recordPayment(req.user.tenantId, id, { ...dto, paymentDate: new Date(dto.paymentDate) });
    }

    // ===== EXPENSES =====
    @Get('expense-categories')
    getExpenseCategories(@Request() req: any) {
        return this.expenseService.getCategories(req.user.tenantId);
    }

    @Post('expense-categories')
    createExpenseCategory(@Request() req: any, @Body() dto: any) {
        return this.expenseService.createCategory(req.user.tenantId, dto);
    }

    @Get('expenses')
    getExpenses(@Request() req: any, @Query('status') status?: string) {
        return this.expenseService.findAll(req.user.tenantId, { status });
    }

    @Post('expenses')
    submitExpense(@Request() req: any, @Body() dto: any) {
        return this.expenseService.submit(req.user.tenantId, req.user.id, { ...dto, date: new Date(dto.date) });
    }

    @Post('expenses/:id/approve')
    approveExpense(@Request() req: any, @Param('id') id: string) {
        return this.expenseService.approve(req.user.tenantId, id, req.user.id);
    }

    @Post('expenses/:id/reject')
    rejectExpense(@Request() req: any, @Param('id') id: string) {
        return this.expenseService.reject(req.user.tenantId, id, req.user.id);
    }

    @Get('expenses/by-category')
    getExpensesByCategory(@Request() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.expenseService.getByCategory(req.user.tenantId, new Date(startDate), new Date(endDate));
    }

    // ===== BANK =====
    @Get('bank-accounts')
    getBankAccounts(@Request() req: any) {
        return this.bankService.getBankAccounts(req.user.tenantId);
    }

    @Post('bank-accounts')
    createBankAccount(@Request() req: any, @Body() dto: any) {
        return this.bankService.createBankAccount(req.user.tenantId, dto);
    }

    @Get('bank-accounts/:id/transactions')
    getBankTransactions(@Request() req: any, @Param('id') id: string) {
        return this.bankService.getTransactions(req.user.tenantId, id);
    }

    @Post('bank-accounts/:id/reconcile')
    reconcileBank(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.bankService.reconcile(req.user.tenantId, id, { ...dto, statementDate: new Date(dto.statementDate), userId: req.user.id });
    }

    // ===== BUDGETS & COST CENTERS =====
    @Get('cost-centers')
    getCostCenters(@Request() req: any) {
        return this.budgetService.getCostCenters(req.user.tenantId);
    }

    @Post('cost-centers')
    createCostCenter(@Request() req: any, @Body() dto: any) {
        return this.budgetService.createCostCenter(req.user.tenantId, dto);
    }

    @Get('budgets')
    getBudgets(@Request() req: any, @Query('year') year?: string) {
        return this.budgetService.getBudgets(req.user.tenantId, year ? parseInt(year) : undefined);
    }

    @Post('budgets')
    createBudget(@Request() req: any, @Body() dto: any) {
        return this.budgetService.createBudget(req.user.tenantId, { ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) });
    }

    @Get('budgets/vs-actual')
    getBudgetVsActual(@Request() req: any, @Query('year') year: string) {
        return this.budgetService.getBudgetVsActual(req.user.tenantId, parseInt(year));
    }

    @Get('fiscal-years')
    getFiscalYears(@Request() req: any) {
        return this.budgetService.getFiscalYears(req.user.tenantId);
    }

    @Post('fiscal-years')
    createFiscalYear(@Request() req: any, @Body('year') year: number) {
        return this.budgetService.createFiscalYear(req.user.tenantId, year);
    }
}
