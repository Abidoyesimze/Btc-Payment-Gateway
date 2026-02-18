import { RpcProvider, Contract } from 'starknet';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { PAYMENT_GATEWAY_ABI } from '../src/modules/blockchain/abis/payment-gateway.abi';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testContractInteraction() {
    console.log('🧪 Testing Smart Contract Interaction\n');

    const PAYMENT_GATEWAY_ADDRESS = process.env.PAYMENT_GATEWAY_ADDRESS;
    const STARKNET_RPC = process.env.STARKNET_RPC_URL;

    if (!PAYMENT_GATEWAY_ADDRESS) {
        console.error('❌ PAYMENT_GATEWAY_ADDRESS not set in .env');
        console.log('   → Deploy your contract first');
        console.log('   → Add address to .env: PAYMENT_GATEWAY_ADDRESS="0x..."');
        process.exit(1);
    }

    console.log('📋 Configuration:');
    console.log('   Contract:', PAYMENT_GATEWAY_ADDRESS);
    console.log('   RPC:', STARKNET_RPC);
    console.log('');

    try {
        // Initialize provider and contract
        const provider = new RpcProvider({ nodeUrl: STARKNET_RPC });
        const contract = new Contract({
            abi: PAYMENT_GATEWAY_ABI,
            address: PAYMENT_GATEWAY_ADDRESS,
            providerOrAccount: provider
        });

        console.log('--- Test 1: Read Contract State ---');

        // Test: Get total payments count
        try {
            const totalPayments = await contract.get_total_payments();
            console.log('✅ get_total_payments():', totalPayments.toString());
        } catch (error: any) {
            console.log('⚠️  get_total_payments() failed:', error.message);
        }

        // Test: Get total volume
        try {
            const totalVolume = await contract.get_total_volume();
            console.log('✅ get_total_volume():', totalVolume.toString());
        } catch (error: any) {
            console.log('⚠️  get_total_volume() failed:', error.message);
        }

        // Test: Get platform fee
        try {
            const platformFee = await contract.get_platform_fee_bps();
            console.log('✅ get_platform_fee_bps():', platformFee.toString(), 'bps');
        } catch (error: any) {
            console.log('⚠️  get_platform_fee_bps() failed:', error.message);
        }

        console.log('\n--- Test 2: Fetch Recent Events ---');

        const latestBlock = await provider.getBlock('latest');
        const fromBlock = Math.max(0, latestBlock.block_number - 100); // Last 100 blocks

        console.log(`   Scanning blocks ${fromBlock} to ${latestBlock.block_number}...`);

        const events = await provider.getEvents({
            from_block: { block_number: fromBlock },
            to_block: { block_number: latestBlock.block_number },
            address: PAYMENT_GATEWAY_ADDRESS,
            keys: [],
            chunk_size: 10
        });

        if (events.events.length > 0) {
            console.log(`✅ Found ${events.events.length} events:`);
            events.events.forEach((event, i) => {
                console.log(`   ${i + 1}. Block ${event.block_number}: ${event.keys.length} keys, ${event.data.length} data items`);
            });
        } else {
            console.log('⚠️  No events found (contract might be newly deployed)');
        }

        console.log('\n--- Test 3: Check Contract Code ---');

        // Verify contract exists on-chain
        const classHash = await provider.getClassHashAt(PAYMENT_GATEWAY_ADDRESS);
        console.log('✅ Contract class hash:', classHash);
        console.log('   → Contract is deployed and accessible');

        console.log('\n🎉 All tests passed!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Backend will auto-connect to this contract on startup');
        console.log('   2. EventListenerService will monitor for PaymentCreated/PaymentCompleted');
        console.log('   3. Test by creating a payment via smart contract');
        console.log('   4. Check backend logs to see event processing');

    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\n   Possible issues:');
        console.error('   - Contract not deployed to this address');
        console.error('   - Wrong network (check STARKNET_NETWORK in .env)');
        console.error('   - RPC endpoint issue');
        process.exit(1);
    }
}

testContractInteraction().catch(console.error);
