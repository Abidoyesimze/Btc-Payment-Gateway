import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with Starknet Wallet' })
    @ApiResponse({ status: 200, description: 'Return JWT access token' })
    @ApiResponse({ status: 401, description: 'Invalid signature' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
