
import { createClient } from '@supabase/supabase-js';
import { RpcProvider } from 'starknet';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    console.log('🚀 Backend Verification (Persistent Test Data)\n');

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const STARKNET_RPC = process.env.STARKNET_RPC_URL;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Missing Supabase Credentials');
        process.exit(1);
    }
    console.log('✅ Environment Variables Loaded\n');

    // === SUPABASE TEST ===
    console.log('--- Supabase Database Test ---');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const testWallet = '0xTEST_WALLET_' + Date.now();

    const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([{
            walletAddress: testWallet,
            role: 'BUYER',
            updatedAt: new Date()
        }])
        .select()
        .single();

    if (insertError) {
        console.error('❌ Insert Failed:', insertError.message);
        if (insertError.code === '42P01') {
            console.error('   → Tables not created. Run supabase_schema.sql in Supabase Dashboard');
        }
    } else {
        console.log('✅ Insert Success');
        console.log('   User ID:', insertData.id);
        console.log('   Wallet:', insertData.walletAddress);
        console.log('   → Check your Supabase Dashboard > Table Editor > users');

        const { data: readData, error: readError } = await supabase
            .from('users')
            .select('*')
            .eq('id', insertData.id)
            .single();

        if (readError) {
            console.error('❌ Read Failed:', readError.message);
        } else {
            console.log('✅ Read Success - Database is fully operational\n');
        }
    }

    // === STARKNET TEST ===
    console.log('--- Starknet RPC Test ---');
    console.log('RPC URL:', STARKNET_RPC);

    try {
        const provider = new RpcProvider({ nodeUrl: STARKNET_RPC });

        // Try to get block number
        const block = await provider.getBlock('latest');
        console.log('✅ Starknet Connected');
        console.log('   Latest Block:', block.block_number);
        console.log('   Block Hash:', block.block_hash);
    } catch (error: any) {
        console.error('❌ Starknet Failed:', error.message);
        console.error('\n   Possible causes:');
        console.error('   1. Node.js version < 18 (missing native fetch)');
        console.error('   2. Network firewall blocking external RPC');
        console.error('   3. SSL certificate issue');
        console.error('\n   → Try running: node --version');
        console.error('   → If < 18, install node-fetch: npm install node-fetch');
    }

    console.log('\n🏁 Verification Complete');
    console.log('\nNOTE: Test user was NOT deleted. Check Supabase Dashboard to confirm.');
}

main().catch(console.error);
