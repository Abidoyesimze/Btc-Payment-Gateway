import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    SHIPPED = 'SHIPPED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    DISPUTED = 'DISPUTED',
}

export class CreateOrderDto {
    @ApiProperty({ description: 'Product ID' })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ description: 'Quantity' })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({ description: 'Shipping Address', required: false })
    @IsString()
    @IsOptional()
    shippingAddress?: string;

    // In a real app, price might be calculated on backend to avoid tampering,
    // but for simplicity/MVP we might pass expected price or just use product price.
}

export class UpdateOrderStatusDto {
    @ApiProperty({ description: 'New Status', enum: OrderStatus })
    @IsEnum(OrderStatus)
    status: OrderStatus;
}
