import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { LoginDto } from './dto/auth.dto';
import { ec, typedData as starknetTypedData } from 'starknet';

@Injectable()
export class AuthService {
    constructor(
        private supabaseService: SupabaseService,
        private jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const { walletAddress, signature, typedData } = loginDto;
        const supabase = this.supabaseService.getClient();

        // 1. Verify Signature (Starknet specific)
        const isValid = await this.verifyStarknetSignature(walletAddress, signature, typedData);
        if (!isValid) {
            throw new UnauthorizedException('Invalid wallet signature');
        }

        // 2. Find or Create User
        // Use Supabase select
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('walletAddress', walletAddress)
            .single();

        let user = existingUser;

        if (!user && (!findError || findError.code === 'PGRST116')) {
            // PGRST116 is "The result contains 0 rows" (not found)
            // Create user
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([
                    {
                        walletAddress,
                        role: 'BUYER',
                        updatedAt: new Date()
                    },
                ])
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                throw new Error('Could not create user');
            }
            user = newUser;
        } else if (findError) {
            console.error('Error finding user:', findError);
            throw new Error('Database error');
        }

        // 3. Generate JWT
        const payload = { sub: user.id, walletAddress: user.walletAddress, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async verifyStarknetSignature(walletAddress: string, signature: string[], typedData: any): Promise<boolean> {
        try {
            if (!typedData || !signature) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('Skipping verification due to missing data in DEV mode');
                    return true;
                }
                return false;
            }

            // Real verification logic
            const msgHash = typeof typedData === 'string'
                ? starknetTypedData.getMessageHash(JSON.parse(typedData), walletAddress)
                : starknetTypedData.getMessageHash(typedData, walletAddress);

            // Construct Signature object using ec library
            const sig = new ec.starkCurve.Signature(
                BigInt(signature[0]),
                BigInt(signature[1])
            );

            const isVerified = ec.starkCurve.verify(
                sig,
                msgHash,
                walletAddress
            );

            if (!isVerified) {
                console.warn(`Signature verification failed for ${walletAddress}`);
            }

            return isVerified;
        } catch (error) {
            console.error('Signature verification failed:', error);
            // Fallback for development if needed, or rigorous fail
            return false;
        }
    }
}
