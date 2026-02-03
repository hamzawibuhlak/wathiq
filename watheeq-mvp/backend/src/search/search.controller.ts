import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Search')
@ApiBearerAuth('JWT-auth')
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    @ApiOperation({ summary: 'البحث الشامل في النظام' })
    @ApiQuery({ name: 'q', required: true, description: 'نص البحث' })
    @ApiQuery({ name: 'type', required: false, enum: ['all', 'cases', 'clients', 'hearings', 'documents', 'invoices'], description: 'نوع النتائج' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'عدد النتائج لكل نوع' })
    @ApiResponse({ status: 200, description: 'نتائج البحث' })
    async globalSearch(
        @Query('q') query: string,
        @Query('type') type: string = 'all',
        @Query('limit') limit: string = '5',
        @TenantId() tenantId: string,
    ) {
        return this.searchService.globalSearch(query, type, parseInt(limit), tenantId);
    }

    @Get('suggestions')
    @ApiOperation({ summary: 'اقتراحات البحث السريع' })
    @ApiQuery({ name: 'q', required: true, description: 'نص البحث' })
    @ApiResponse({ status: 200, description: 'اقتراحات البحث' })
    async getSearchSuggestions(
        @Query('q') query: string,
        @TenantId() tenantId: string,
    ) {
        return this.searchService.getSearchSuggestions(query, tenantId);
    }
}
