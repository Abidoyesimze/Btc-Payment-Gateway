import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMerchantDto {
    @ApiProperty({ description: 'Merchant Name', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: 'Merchant Description', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Merchant Logo URL', required: false })
    @IsUrl()
    @IsOptional()
    logoUrl?: string;

    @ApiProperty({ description: 'Notification Email', required: false })
    @IsString()
    @IsOptional()
    email?: string;
}
