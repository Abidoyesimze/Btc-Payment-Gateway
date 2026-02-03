// Bitcoin Payment Gateway Contract
// Handles payment requests, processing, and settlements

#[starknet::contract]
mod PaymentGateway {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::security::pausable::PausableComponent;
    use openzeppelin::security::reentrancyguard::ReentrancyGuardComponent;
    
    // ============ Components ============
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: ReentrancyGuardComponent, storage: reentrancy, event: ReentrancyEvent);
    
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    
    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;
    
    impl ReentrancyInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;
    
    // ============ Storage ============
    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
        #[substorage(v0)]
        reentrancy: ReentrancyGuardComponent::Storage,
        
        // Payment token (WBTC address)
        payment_token: ContractAddress,
        
        // Payment tracking
        payment_counter: u256,
        payments: LegacyMap<u256, Payment>,
        merchant_payments: LegacyMap<(ContractAddress, u256), u256>, // (merchant, index) -> payment_id
        merchant_payment_count: LegacyMap<ContractAddress, u256>,
        
        // Merchant registry
        registered_merchants: LegacyMap<ContractAddress, bool>,
        merchant_names: LegacyMap<ContractAddress, felt252>,
        
        // Fee configuration
        platform_fee_bps: u256, // Basis points (100 = 1%)
        fee_recipient: ContractAddress,
        
        // Statistics
        total_volume: u256,
        total_payments: u256,
        total_fees_collected: u256,
    }
    
    // ============ Structs ============
    #[derive(Drop, Serde, starknet::Store)]
    pub struct Payment {
        payment_id: u256,
        merchant: ContractAddress,
        customer: ContractAddress,
        amount: u256,
        fee: u256,
        status: PaymentStatus,
        created_at: u64,
        paid_at: u64,
        metadata: felt252, // Order ID or reference
    }
    
    #[derive(Drop, Serde, starknet::Store, PartialEq)]
    pub enum PaymentStatus {
        Pending,
        Completed,
        Cancelled,
        Refunded,
    }
    
    // ============ Events ============
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        PausableEvent: PausableComponent::Event,
        #[flat]
        ReentrancyEvent: ReentrancyGuardComponent::Event,
        
        PaymentCreated: PaymentCreated,
        PaymentCompleted: PaymentCompleted,
        PaymentCancelled: PaymentCancelled,
        PaymentRefunded: PaymentRefunded,
        MerchantRegistered: MerchantRegistered,
        FeeUpdated: FeeUpdated,
    }
    
    #[derive(Drop, starknet::Event)]
    struct PaymentCreated {
        #[key]
        payment_id: u256,
        #[key]
        merchant: ContractAddress,
        #[key]
        customer: ContractAddress,
        amount: u256,
        metadata: felt252,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct PaymentCompleted {
        #[key]
        payment_id: u256,
        #[key]
        merchant: ContractAddress,
        amount_to_merchant: u256,
        fee: u256,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct PaymentCancelled {
        #[key]
        payment_id: u256,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct PaymentRefunded {
        #[key]
        payment_id: u256,
        #[key]
        customer: ContractAddress,
        amount: u256,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct MerchantRegistered {
        #[key]
        merchant: ContractAddress,
        name: felt252,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct FeeUpdated {
        old_fee_bps: u256,
        new_fee_bps: u256,
    }
    
    // ============ Constructor ============
    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        payment_token: ContractAddress,
        fee_recipient: ContractAddress,
        initial_fee_bps: u256,
    ) {
        self.ownable.initializer(owner);
        self.payment_token.write(payment_token);
        self.fee_recipient.write(fee_recipient);
        self.platform_fee_bps.write(initial_fee_bps); // e.g., 250 = 2.5%
        self.payment_counter.write(0);
    }
    
    // ============ Public Functions ============
    
    #[external(v0)]
    impl PaymentGatewayImpl of super::IPaymentGateway<ContractState> {
        /// Create a new payment request
        fn create_payment(
            ref self: ContractState,
            amount: u256,
            metadata: felt252,
        ) -> u256 {
            self.pausable.assert_not_paused();
            
            let merchant = get_caller_address();
            
            // Verify merchant is registered
            assert(self.registered_merchants.read(merchant), 'Merchant not registered');
            assert(amount > 0, 'Amount must be greater than 0');
            
            // Generate payment ID
            let payment_id = self.payment_counter.read() + 1;
            self.payment_counter.write(payment_id);
            
            // Calculate fee
            let fee = self._calculate_fee(amount);
            
            // Create payment record
            let payment = Payment {
                payment_id: payment_id,
                merchant: merchant,
                customer: starknet::contract_address_const::<0>(), // Set when paid
                amount: amount,
                fee: fee,
                status: PaymentStatus::Pending,
                created_at: get_block_timestamp(),
                paid_at: 0,
                metadata: metadata,
            };
            
            self.payments.write(payment_id, payment);
            
            // Add to merchant's payment list
            let merchant_idx = self.merchant_payment_count.read(merchant);
            self.merchant_payments.write((merchant, merchant_idx), payment_id);
            self.merchant_payment_count.write(merchant, merchant_idx + 1);
            
            // Emit event
            self.emit(PaymentCreated {
                payment_id: payment_id,
                merchant: merchant,
                customer: starknet::contract_address_const::<0>(),
                amount: amount,
                metadata: metadata,
                timestamp: get_block_timestamp(),
            });
            
            payment_id
        }
        
        /// Process payment from customer
        fn pay(ref self: ContractState, payment_id: u256) {
            self.pausable.assert_not_paused();
            self.reentrancy.start();
            
            let customer = get_caller_address();
            let mut payment = self.payments.read(payment_id);
            
            // Validate payment
            assert(payment.payment_id != 0, 'Payment does not exist');
            assert(payment.status == PaymentStatus::Pending, 'Payment not pending');
            
            // Get token dispatcher
            let token = IERC20Dispatcher { contract_address: self.payment_token.read() };
            
            // Calculate amounts
            let amount_to_merchant = payment.amount - payment.fee;
            let fee = payment.fee;
            
            // Transfer from customer to merchant
            let success1 = token.transfer_from(
                customer,
                payment.merchant,
                amount_to_merchant
            );
            assert(success1, 'Transfer to merchant failed');
            
            // Transfer fee to platform
            if fee > 0 {
                let success2 = token.transfer_from(
                    customer,
                    self.fee_recipient.read(),
                    fee
                );
                assert(success2, 'Fee transfer failed');
            }
            
            // Update payment status
            payment.customer = customer;
            payment.status = PaymentStatus::Completed;
            payment.paid_at = get_block_timestamp();
            self.payments.write(payment_id, payment);
            
            // Update statistics
            let payment_amount = payment.amount;
            self.total_volume.write(self.total_volume.read() + payment_amount);
            self.total_payments.write(self.total_payments.read() + 1);
            self.total_fees_collected.write(self.total_fees_collected.read() + fee);
            
            // Emit event
            self.emit(PaymentCompleted {
                payment_id: payment_id,
                merchant: payment.merchant,
                amount_to_merchant: amount_to_merchant,
                fee: fee,
                timestamp: get_block_timestamp(),
            });
            
            self.reentrancy.end();
        }
        
        /// Cancel a payment (merchant only)
        fn cancel_payment(ref self: ContractState, payment_id: u256) {
            let caller = get_caller_address();
            let mut payment = self.payments.read(payment_id);
            
            assert(payment.payment_id != 0, 'Payment does not exist');
            assert(payment.merchant == caller, 'Not payment merchant');
            assert(payment.status == PaymentStatus::Pending, 'Cannot cancel payment');
            
            payment.status = PaymentStatus::Cancelled;
            self.payments.write(payment_id, payment);
            
            self.emit(PaymentCancelled {
                payment_id: payment_id,
                timestamp: get_block_timestamp(),
            });
        }
        
        /// Refund a completed payment (merchant only)
        fn refund(ref self: ContractState, payment_id: u256) {
            self.pausable.assert_not_paused();
            self.reentrancy.start();
            
            let caller = get_caller_address();
            let mut payment = self.payments.read(payment_id);
            
            // Validate payment
            assert(payment.payment_id != 0, 'Payment does not exist');
            assert(payment.merchant == caller, 'Not payment merchant');
            assert(payment.status == PaymentStatus::Completed, 'Payment not completed');
            assert(payment.customer != starknet::contract_address_const::<0>(), 'No customer to refund');
            
            // Get token dispatcher
            let token = IERC20Dispatcher { contract_address: self.payment_token.read() };
            
            // Calculate refund amount (full amount including fee)
            let refund_amount = payment.amount;
            
            // Transfer from merchant back to customer
            let success = token.transfer_from(
                payment.merchant,
                payment.customer,
                refund_amount
            );
            assert(success, 'Refund transfer failed');
            
            // Update payment status
            payment.status = PaymentStatus::Refunded;
            self.payments.write(payment_id, payment);
            
            // Update statistics (subtract from totals)
            let payment_amount = payment.amount;
            self.total_volume.write(self.total_volume.read() - payment_amount);
            self.total_payments.write(self.total_payments.read() - 1);
            // Note: Fees are not refunded, so we don't subtract from total_fees_collected
            
            // Emit event
            self.emit(PaymentRefunded {
                payment_id: payment_id,
                customer: payment.customer,
                amount: refund_amount,
                timestamp: get_block_timestamp(),
            });
            
            self.reentrancy.end();
        }
        
        /// Get payment details
        fn get_payment(self: @ContractState, payment_id: u256) -> Payment {
            self.payments.read(payment_id)
        }
        
        /// Get merchant's payments
        fn get_merchant_payment_count(self: @ContractState, merchant: ContractAddress) -> u256 {
            self.merchant_payment_count.read(merchant)
        }
        
        fn get_merchant_payment_at_index(
            self: @ContractState,
            merchant: ContractAddress,
            index: u256
        ) -> u256 {
            self.merchant_payments.read((merchant, index))
        }
        
        /// Get platform statistics
        fn get_total_volume(self: @ContractState) -> u256 {
            self.total_volume.read()
        }
        
        fn get_total_payments(self: @ContractState) -> u256 {
            self.total_payments.read()
        }
        
        fn get_total_fees_collected(self: @ContractState) -> u256 {
            self.total_fees_collected.read()
        }
        
        fn get_platform_fee_bps(self: @ContractState) -> u256 {
            self.platform_fee_bps.read()
        }
    }
    
    // ============ Merchant Functions ============
    
    #[generate_trait]
    #[external(v0)]
    impl MerchantImpl of MerchantTrait {
        /// Register as a merchant
        fn register_merchant(ref self: ContractState, name: felt252) {
            let merchant = get_caller_address();
            assert(!self.registered_merchants.read(merchant), 'Already registered');
            
            self.registered_merchants.write(merchant, true);
            self.merchant_names.write(merchant, name);
            
            self.emit(MerchantRegistered {
                merchant: merchant,
                name: name,
                timestamp: get_block_timestamp(),
            });
        }
        
        /// Check if address is registered merchant
        fn is_registered_merchant(self: @ContractState, merchant: ContractAddress) -> bool {
            self.registered_merchants.read(merchant)
        }
        
        /// Get merchant name
        fn get_merchant_name(self: @ContractState, merchant: ContractAddress) -> felt252 {
            self.merchant_names.read(merchant)
        }
    }
    
    // ============ Admin Functions ============
    
    #[generate_trait]
    #[external(v0)]
    impl AdminImpl of AdminTrait {
        /// Update platform fee
        fn set_platform_fee(ref self: ContractState, new_fee_bps: u256) {
            self.ownable.assert_only_owner();
            assert(new_fee_bps <= 1000, 'Fee too high'); // Max 10%
            
            let old_fee = self.platform_fee_bps.read();
            self.platform_fee_bps.write(new_fee_bps);
            
            self.emit(FeeUpdated {
                old_fee_bps: old_fee,
                new_fee_bps: new_fee_bps,
            });
        }
        
        /// Update fee recipient
        fn set_fee_recipient(ref self: ContractState, new_recipient: ContractAddress) {
            self.ownable.assert_only_owner();
            self.fee_recipient.write(new_recipient);
        }
        
        /// Pause/unpause contract
        fn pause(ref self: ContractState) {
            self.ownable.assert_only_owner();
            self.pausable.pause();
        }
        
        fn unpause(ref self: ContractState) {
            self.ownable.assert_only_owner();
            self.pausable.unpause();
        }
    }
    
    // ============ Internal Functions ============
    
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _calculate_fee(self: @ContractState, amount: u256) -> u256 {
            let fee_bps = self.platform_fee_bps.read();
            (amount * fee_bps) / 10000
        }
    }
}

// ============ Interface ============
use starknet::ContractAddress;

#[starknet::interface]
trait IPaymentGateway<TContractState> {
    // Payment functions
    fn create_payment(ref self: TContractState, amount: u256, metadata: felt252) -> u256;
    fn pay(ref self: TContractState, payment_id: u256);
    fn cancel_payment(ref self: TContractState, payment_id: u256);
    fn refund(ref self: TContractState, payment_id: u256);
    fn get_payment(self: @TContractState, payment_id: u256) -> PaymentGateway::Payment;
    fn get_merchant_payment_count(self: @TContractState, merchant: ContractAddress) -> u256;
    fn get_merchant_payment_at_index(
        self: @TContractState,
        merchant: ContractAddress,
        index: u256
    ) -> u256;
    fn get_total_volume(self: @TContractState) -> u256;
    fn get_total_payments(self: @TContractState) -> u256;
    fn get_total_fees_collected(self: @TContractState) -> u256;
    fn get_platform_fee_bps(self: @TContractState) -> u256;
}
