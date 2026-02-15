import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ description: 'Starknet Wallet Address' })
    @IsString()
    @IsNotEmpty()
    walletAddress: string;

    @ApiProperty({ description: 'Signature array from the wallet' })
    @IsArray()
    @IsNotEmpty()
    signature: string[];

    @ApiProperty({ description: 'Typed Data used for signing' })
    @IsNotEmpty()
    typedData: any;
}

export class RegisterDto extends LoginDto {
    @ApiProperty({ description: 'Optional: Merchant Name', required: false })
    @IsString()
    @IsOptional()
    merchantName?: string;
}
