import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
    EXPIRED = 'EXPIRED',
}

export class CreatePaymentDto {
    @ApiProperty({ description: 'Merchant Wallet Address or ID' })
    @IsString()
    @IsNotEmpty()
    merchantId: string;

    @ApiProperty({ description: 'Amount in Satoshis' })
    @IsNumber()
    @Min(1)
    amount: number;

    @ApiProperty({ description: 'Optional: Customer ID', required: false })
    @IsString()
    @IsOptional()
    customerId?: string;

    @ApiProperty({ description: 'Payment Metadata', required: false })
    @IsOptional()
    metadata?: any;
}
