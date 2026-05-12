import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@ApiTags('company-settings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('company-settings')
export class CompanySettingsController {
    constructor(private readonly service: CompanySettingsService) { }

    @Get()
    async get() {
        return this.service.get();
    }

    @Patch()
    @Roles('OWNER', 'ADMIN')
    async update(@Body() dto: UpdateCompanySettingsDto) {
        return this.service.update(dto);
    }
}
