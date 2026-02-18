import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({ description: 'Product Name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Product Description' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'Price in Satoshis' })
    @IsNumber()
    @Min(1)
    price: number;

    @ApiProperty({ description: 'Images URLs', type: [String] })
    @IsArray()
    @IsString({ each: true })
    images: string[];

    @ApiProperty({ description: 'Category' })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty({ description: 'Stock Quantity' })
    @IsNumber()
    @Min(0)
    stock: number;
}

export class UpdateProductDto extends CreateProductDto {
    @ApiProperty({ description: 'Is Active Status', required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
