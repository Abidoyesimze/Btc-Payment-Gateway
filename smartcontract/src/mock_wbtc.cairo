// Mock WBTC Token Contract for Hackathon Demo
// This mimics real WBTC behavior on Starknet testnet

#[starknet::contract]
mod MockWBTC {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess};
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin::access::ownable::OwnableComponent;
    
    // ============ Components ============
    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    
    // ERC20 Mixin - provides all standard ERC20 functions
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    
    // Ownable for admin functions
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    
    // ============ Storage ============
    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        
        // Faucet configuration
        faucet_amount: u256,
        faucet_cooldown: u64,
        last_faucet_claim: LegacyMap<ContractAddress, u64>,
        
        // Statistics (for demo/analytics)
        total_minted: u256,
        total_faucet_claims: u256,
    }
    
    // ============ Events ============
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        
        FaucetClaimed: FaucetClaimed,
        FaucetAmountUpdated: FaucetAmountUpdated,
    }
    
    #[derive(Drop, starknet::Event)]
    struct FaucetClaimed {
        #[key]
        claimer: ContractAddress,
        amount: u256,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct FaucetAmountUpdated {
        old_amount: u256,
        new_amount: u256,
    }
    
    // ============ Constructor ============
    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        initial_supply: u256,
    ) {
        // Initialize ERC20 with Bitcoin-style decimals (8)
        let name = "Mock Wrapped Bitcoin";
        let symbol = "WBTC";
        self.erc20.initializer(name, symbol);
        
        // Initialize ownership
        self.ownable.initializer(owner);
        
        // Mint initial supply to owner
        self.erc20.mint(owner, initial_supply);
        
        // Set default faucet amount: 0.1 WBTC (in satoshis)
        self.faucet_amount.write(10_000_000_u256); // 0.1 BTC
        
        // Set cooldown: 1 hour (3600 seconds)
        self.faucet_cooldown.write(3600_u64);
        
        self.total_minted.write(initial_supply);
    }
    
    // ============ Faucet Functions ============
    
    #[external(v0)]
    impl MockWBTCImpl of super::IMockWBTC<ContractState> {
        /// Faucet function - Anyone can claim test WBTC
        /// Perfect for hackathon demos and testing
        fn claim_faucet(ref self: ContractState) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let last_claim = self.last_faucet_claim.read(caller);
            let cooldown = self.faucet_cooldown.read();
            
            // Check cooldown period
            assert(
                current_time >= last_claim + cooldown,
                'Faucet: cooldown not passed'
            );
            
            let amount = self.faucet_amount.read();
            
            // Mint tokens to claimer
            self.erc20.mint(caller, amount);
            
            // Update statistics
            self.last_faucet_claim.write(caller, current_time);
            self.total_minted.write(self.total_minted.read() + amount);
            self.total_faucet_claims.write(self.total_faucet_claims.read() + 1);
            
            // Emit event
            self.emit(FaucetClaimed {
                claimer: caller,
                amount: amount,
                timestamp: current_time,
            });
        }
        
        /// Check how long until user can claim again
        fn time_until_next_claim(self: @ContractState, user: ContractAddress) -> u64 {
            let current_time = get_block_timestamp();
            let last_claim = self.last_faucet_claim.read(user);
            let cooldown = self.faucet_cooldown.read();
            
            if current_time >= last_claim + cooldown {
                0
            } else {
                (last_claim + cooldown) - current_time
            }
        }
        
        /// Get faucet configuration
        fn get_faucet_amount(self: @ContractState) -> u256 {
            self.faucet_amount.read()
        }
        
        fn get_faucet_cooldown(self: @ContractState) -> u64 {
            self.faucet_cooldown.read()
        }
        
        /// Get statistics
        fn get_total_minted(self: @ContractState) -> u256 {
            self.total_minted.read()
        }
        
        fn get_total_faucet_claims(self: @ContractState) -> u256 {
            self.total_faucet_claims.read()
        }
    }
    
    // ============ Admin Functions ============
    
    #[generate_trait]
    #[external(v0)]
    impl AdminImpl of AdminTrait {
        /// Owner can mint tokens for demo purposes
        fn mint(
            ref self: ContractState,
            recipient: ContractAddress,
            amount: u256
        ) {
            self.ownable.assert_only_owner();
            self.erc20.mint(recipient, amount);
            self.total_minted.write(self.total_minted.read() + amount);
        }
        
        /// Owner can update faucet amount
        fn set_faucet_amount(ref self: ContractState, new_amount: u256) {
            self.ownable.assert_only_owner();
            let old_amount = self.faucet_amount.read();
            self.faucet_amount.write(new_amount);
            
            self.emit(FaucetAmountUpdated {
                old_amount: old_amount,
                new_amount: new_amount,
            });
        }
        
        /// Owner can update cooldown period
        fn set_faucet_cooldown(ref self: ContractState, new_cooldown: u64) {
            self.ownable.assert_only_owner();
            self.faucet_cooldown.write(new_cooldown);
        }
        
        /// Emergency: Reset someone's cooldown (for demo purposes)
        fn reset_cooldown(ref self: ContractState, user: ContractAddress) {
            self.ownable.assert_only_owner();
            self.last_faucet_claim.write(user, 0_u64);
        }
    }
    
    // ============ ERC20 Metadata Override ============
    // Override decimals to return 8 (Bitcoin standard)
    
    #[external(v0)]
    fn decimals(self: @ContractState) -> u8 {
        8_u8  // Bitcoin uses 8 decimals (satoshis)
    }
}

// ============ Interface ============
use starknet::ContractAddress;

#[starknet::interface]
trait IMockWBTC<TContractState> {
    // Faucet functions
    fn claim_faucet(ref self: TContractState);
    fn time_until_next_claim(self: @TContractState, user: ContractAddress) -> u64;
    fn get_faucet_amount(self: @TContractState) -> u256;
    fn get_faucet_cooldown(self: @TContractState) -> u64;
    fn get_total_minted(self: @TContractState) -> u256;
    fn get_total_faucet_claims(self: @TContractState) -> u256;
}
