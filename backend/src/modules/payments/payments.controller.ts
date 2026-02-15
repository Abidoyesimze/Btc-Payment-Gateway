import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new payment' })
    @ApiResponse({ status: 201, description: 'Payment created successfully' })
    create(@Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentsService.create(createPaymentDto);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all payments' })
    findAll() {
        return this.paymentsService.findAll();
    }

    @Get('merchant/:merchantId')
    @ApiOperation({ summary: 'Get payments by merchant ID' })
    findByMerchant(@Param('merchantId') merchantId: string) {
        return this.paymentsService.findByMerchant(merchantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get payment by ID' })
    findOne(@Param('id') id: string) {
        // Note: We might want to add serialization to handle BigInt to string conversion for JSON response
        return this.paymentsService.findOne(id);
    }
}
