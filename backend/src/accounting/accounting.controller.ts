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
        return this.accountService.findAll({ type });
    }

    @Get('accounts/hierarchy')
    getAccountsHierarchy(@Request() req: any) {
        return this.accountService.getHierarchy();
    }

    @Post('accounts')
    createAccount(@Request() req: any, @Body() dto: any) {
        return this.accountService.create(dto);
    }

    @Patch('accounts/:id')
    updateAccount(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.accountService.update(id, dto);
    }

    @Post('accounts/seed')
    seedAccounts(@Request() req: any) {
        return this.accountService.seedDefaultAccounts();
    }

    @Get('accounts/:id/balance')
    getAccountBalance(@Request() req: any, @Param('id') id: string) {
        return this.accountService.getBalance(id);
    }

    // ===== JOURNAL ENTRIES =====
    @Get('journal-entries')
    getJournalEntries(@Request() req: any, @Query('status') status?: string, @Query('page') page?: string) {
        return this.journalEntryService.findAll({
            status, page: page ? parseInt(page) : 1 });
    }

    @Get('journal-entries/:id')
    getJournalEntry(@Request() req: any, @Param('id') id: string) {
        return this.journalEntryService.findOne(id);
    }

    @Post('journal-entries')
    createJournalEntry(@Request() req: any, @Body() dto: any) {
        return this.journalEntryService.create(req.user.id, {
            ...dto, date: new Date(dto.date) });
    }

    @Post('journal-entries/:id/approve')
    approveJournalEntry(@Request() req: any, @Param('id') id: string) {
        return this.journalEntryService.approve(id, req.user.id);
    }

    @Post('journal-entries/:id/post')
    postJournalEntry(@Request() req: any, @Param('id') id: string) {
        return this.journalEntryService.post(id, req.user.id);
    }

    @Post('journal-entries/:id/reverse')
    reverseJournalEntry(@Request() req: any, @Param('id') id: string, @Body('reason') reason: string) {
        return this.journalEntryService.reverse(id, req.user.id, reason);
    }

    @Post('journal-entries/from-invoice')
    createJEFromInvoice(@Request() req: any, @Body('invoiceId') invoiceId: string) {
        return this.journalEntryService.createFromInvoice(invoiceId);
    }

    // ===== GENERAL LEDGER =====
    @Get('ledger/:accountId')
    getGeneralLedger(@Request() req: any, @Param('accountId') accountId: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
        return this.journalEntryService.getGeneralLedger(accountId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get('trial-balance')
    getTrialBalance(@Request() req: any, @Query('date') date?: string) {
        return this.journalEntryService.getTrialBalance(date ? new Date(date) : new Date());
    }

    // ===== FINANCIAL STATEMENTS =====
    @Get('statements/income')
    getIncomeStatement(@Request() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.financialStatementsService.getIncomeStatement(new Date(startDate), new Date(endDate));
    }

    @Get('statements/balance-sheet')
    getBalanceSheet(@Request() req: any, @Query('date') date?: string) {
        return this.financialStatementsService.getBalanceSheet(date ? new Date(date) : new Date());
    }

    @Get('statements/cash-flow')
    getCashFlow(@Request() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.financialStatementsService.getCashFlowStatement(new Date(startDate), new Date(endDate));
    }

    @Get('statements/ratios')
    getFinancialRatios(@Request() req: any, @Query('date') date?: string) {
        return this.financialStatementsService.getFinancialRatios(date ? new Date(date) : new Date());
    }

    @Get('statements/vat')
    getVATReport(@Request() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.financialStatementsService.getVATReport(new Date(startDate), new Date(endDate));
    }

    // ===== ACCOUNTS RECEIVABLE =====
    @Get('ar')
    getAR(@Request() req: any) {
        return this.arService.findAll();
    }

    @Get('ar/aging')
    getARAgingReport(@Request() req: any) {
        return this.arService.getAgingReport();
    }

    @Post('ar/from-invoice')
    createARFromInvoice(@Request() req: any, @Body('invoiceId') invoiceId: string) {
        return this.arService.createFromInvoice(invoiceId);
    }

    @Post('ar/:id/payment')
    recordARPayment(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.arService.recordPayment(id, { ...dto, paymentDate: new Date(dto.paymentDate) });
    }

    // ===== ACCOUNTS PAYABLE =====
    @Get('vendors')
    getVendors(@Request() req: any) {
        return this.apService.getVendors();
    }

    @Post('vendors')
    createVendor(@Request() req: any, @Body() dto: any) {
        return this.apService.createVendor(dto);
    }

    @Patch('vendors/:id')
    updateVendor(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.apService.updateVendor(id, dto);
    }

    @Get('ap')
    getAP(@Request() req: any) {
        return this.apService.findAllBills();
    }

    @Get('ap/aging')
    getAPAging(@Request() req: any) {
        return this.apService.getAgingReport();
    }

    @Post('ap')
    createBill(@Request() req: any, @Body() dto: any) {
        return this.apService.createBill({ ...dto, billDate: new Date(dto.billDate), dueDate: new Date(dto.dueDate) });
    }

    @Post('ap/:id/payment')
    recordAPPayment(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.apService.recordPayment(id, { ...dto, paymentDate: new Date(dto.paymentDate) });
    }

    // ===== EXPENSES =====
    @Get('expense-categories')
    getExpenseCategories(@Request() req: any) {
        return this.expenseService.getCategories();
    }

    @Post('expense-categories')
    createExpenseCategory(@Request() req: any, @Body() dto: any) {
        return this.expenseService.createCategory(dto);
    }

    @Get('expenses')
    getExpenses(@Request() req: any, @Query('status') status?: string) {
        return this.expenseService.findAll({ status });
    }

    @Post('expenses')
    submitExpense(@Request() req: any, @Body() dto: any) {
        return this.expenseService.submit(req.user.id, { ...dto, date: new Date(dto.date) });
    }

    @Post('expenses/:id/approve')
    approveExpense(@Request() req: any, @Param('id') id: string) {
        return this.expenseService.approve(id, req.user.id);
    }

    @Post('expenses/:id/reject')
    rejectExpense(@Request() req: any, @Param('id') id: string) {
        return this.expenseService.reject(id, req.user.id);
    }

    @Get('expenses/by-category')
    getExpensesByCategory(@Request() req: any, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
        return this.expenseService.getByCategory(new Date(startDate), new Date(endDate));
    }

    // ===== BANK =====
    @Get('bank-accounts')
    getBankAccounts(@Request() req: any) {
        return this.bankService.getBankAccounts();
    }

    @Post('bank-accounts')
    createBankAccount(@Request() req: any, @Body() dto: any) {
        return this.bankService.createBankAccount(dto);
    }

    @Get('bank-accounts/:id/transactions')
    getBankTransactions(@Request() req: any, @Param('id') id: string) {
        return this.bankService.getTransactions(id);
    }

    @Post('bank-accounts/:id/reconcile')
    reconcileBank(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
        return this.bankService.reconcile(id, { ...dto, statementDate: new Date(dto.statementDate), userId: req.user.id });
    }

    // ===== BUDGETS & COST CENTERS =====
    @Get('cost-centers')
    getCostCenters(@Request() req: any) {
        return this.budgetService.getCostCenters();
    }

    @Post('cost-centers')
    createCostCenter(@Request() req: any, @Body() dto: any) {
        return this.budgetService.createCostCenter(dto);
    }

    @Get('budgets')
    getBudgets(@Request() req: any, @Query('year') year?: string) {
        return this.budgetService.getBudgets(year ? parseInt(year) : undefined);
    }

    @Post('budgets')
    createBudget(@Request() req: any, @Body() dto: any) {
        return this.budgetService.createBudget({ ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) });
    }

    @Get('budgets/vs-actual')
    getBudgetVsActual(@Request() req: any, @Query('year') year: string) {
        return this.budgetService.getBudgetVsActual(parseInt(year));
    }

    @Get('fiscal-years')
    getFiscalYears(@Request() req: any) {
        return this.budgetService.getFiscalYears();
    }

    @Post('fiscal-years')
    createFiscalYear(@Request() req: any, @Body('year') year: number) {
        return this.budgetService.createFiscalYear(year);
    }
}
