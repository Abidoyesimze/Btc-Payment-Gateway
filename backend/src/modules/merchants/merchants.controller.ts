import { Controller, Get, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { UpdateMerchantDto } from './dto/merchant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
    constructor(private readonly merchantsService: MerchantsService) { }

    @Get()
    @ApiOperation({ summary: 'List all merchants' })
    findAll() {
        return this.merchantsService.findAll();
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current merchant profile' })
    getProfile(@Request() req) {
        return this.merchantsService.findOne(req.user.userId);
    }

    @Get('dashboard')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get merchant dashboard stats' })
    getDashboard(@Request() req) {
        return this.merchantsService.getDashboardStats(req.user.userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get merchant public profile by ID' })
    findOne(@Param('id') id: string) {
        return this.merchantsService.findOne(id);
    }

    @Patch('profile')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update merchant profile' })
    update(@Request() req, @Body() updateMerchantDto: UpdateMerchantDto) {
        return this.merchantsService.update(req.user.userId, updateMerchantDto);
    }
}
