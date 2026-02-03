// Bitcoin Marketplace Contract
// Demo marketplace showcasing the payment gateway in action

#[starknet::contract]
mod Marketplace {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, StorageMapReadAccess, StorageMapWriteAccess};
    use openzeppelin::access::ownable::OwnableComponent;
    use super::super::payment_gateway::{IPaymentGatewayDispatcher, IPaymentGatewayDispatcherTrait};
    
    // ============ Components ============
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    
    // ============ Storage ============
    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        
        // Payment gateway reference
        payment_gateway: ContractAddress,
        
        // Product tracking
        product_counter: u256,
        products: LegacyMap<u256, Product>,
        seller_products: LegacyMap<(ContractAddress, u256), u256>, // (seller, index) -> product_id
        seller_product_count: LegacyMap<ContractAddress, u256>,
        
        // Order tracking
        order_counter: u256,
        orders: LegacyMap<u256, Order>,
        buyer_orders: LegacyMap<(ContractAddress, u256), u256>, // (buyer, index) -> order_id
        buyer_order_count: LegacyMap<ContractAddress, u256>,
        seller_orders: LegacyMap<(ContractAddress, u256), u256>, // (seller, index) -> order_id
        seller_order_count: LegacyMap<ContractAddress, u256>,
        
        // Categories
        product_categories: LegacyMap<u256, felt252>, // product_id -> category
        
        // Active status
        product_active: LegacyMap<u256, bool>,
    }
    
    // ============ Structs ============
    #[derive(Drop, Serde, starknet::Store)]
    pub struct Product {
        product_id: u256,
        seller: ContractAddress,
        name: felt252,
        description: felt252,
        price: u256, // in WBTC (satoshis)
        inventory: u256,
        category: felt252,
        created_at: u64,
        is_active: bool,
    }
    
    #[derive(Drop, Serde, starknet::Store)]
    pub struct Order {
        order_id: u256,
        product_id: u256,
        buyer: ContractAddress,
        seller: ContractAddress,
        quantity: u256,
        total_price: u256,
        payment_id: u256, // Gateway payment ID
        status: OrderStatus,
        created_at: u64,
        completed_at: u64,
    }
    
    #[derive(Drop, Serde, starknet::Store, PartialEq)]
    pub enum OrderStatus {
        Pending,
        Paid,
        Shipped,
        Delivered,
        Cancelled,
    }
    
    // ============ Events ============
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        
        ProductListed: ProductListed,
        ProductUpdated: ProductUpdated,
        ProductDeactivated: ProductDeactivated,
        OrderCreated: OrderCreated,
        OrderPaid: OrderPaid,
        OrderShipped: OrderShipped,
        OrderDelivered: OrderDelivered,
        OrderCancelled: OrderCancelled,
    }
    
    #[derive(Drop, starknet::Event)]
    struct ProductListed {
        #[key]
        product_id: u256,
        #[key]
        seller: ContractAddress,
        name: felt252,
        price: u256,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct ProductUpdated {
        #[key]
        product_id: u256,
        price: u256,
        inventory: u256,
    }
    
    #[derive(Drop, starknet::Event)]
    struct ProductDeactivated {
        #[key]
        product_id: u256,
    }
    
    #[derive(Drop, starknet::Event)]
    struct OrderCreated {
        #[key]
        order_id: u256,
        #[key]
        buyer: ContractAddress,
        #[key]
        seller: ContractAddress,
        product_id: u256,
        quantity: u256,
        total_price: u256,
        payment_id: u256,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct OrderPaid {
        #[key]
        order_id: u256,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct OrderShipped {
        #[key]
        order_id: u256,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct OrderDelivered {
        #[key]
        order_id: u256,
        timestamp: u64,
    }
    
    #[derive(Drop, starknet::Event)]
    struct OrderCancelled {
        #[key]
        order_id: u256,
        timestamp: u64,
    }
    
    // ============ Constructor ============
    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        payment_gateway: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        self.payment_gateway.write(payment_gateway);
        self.product_counter.write(0);
        self.order_counter.write(0);
    }
    
    // ============ Product Functions ============
    
    #[external(v0)]
    impl MarketplaceImpl of super::IMarketplace<ContractState> {
        /// List a new product
        fn list_product(
            ref self: ContractState,
            name: felt252,
            description: felt252,
            price: u256,
            inventory: u256,
            category: felt252,
        ) -> u256 {
            let seller = get_caller_address();
            
            // Verify seller is a registered merchant
            let gateway = IPaymentGatewayDispatcher {
                contract_address: self.payment_gateway.read()
            };
            assert(gateway.is_registered_merchant(seller), 'Seller must be registered merchant');
            
            assert(price > 0, 'Price must be greater than 0');
            assert(inventory > 0, 'Inventory must be positive');
            
            // Generate product ID
            let product_id = self.product_counter.read() + 1;
            self.product_counter.write(product_id);
            
            // Create product
            let product = Product {
                product_id: product_id,
                seller: seller,
                name: name,
                description: description,
                price: price,
                inventory: inventory,
                category: category,
                created_at: get_block_timestamp(),
                is_active: true,
            };
            
            self.products.write(product_id, product);
            self.product_active.write(product_id, true);
            self.product_categories.write(product_id, category);
            
            // Add to seller's product list
            let seller_idx = self.seller_product_count.read(seller);
            self.seller_products.write((seller, seller_idx), product_id);
            self.seller_product_count.write(seller, seller_idx + 1);
            
            // Emit event
            self.emit(ProductListed {
                product_id: product_id,
                seller: seller,
                name: name,
                price: price,
                timestamp: get_block_timestamp(),
            });
            
            product_id
        }
        
        /// Update product
        fn update_product(
            ref self: ContractState,
            product_id: u256,
            price: u256,
            inventory: u256,
        ) {
            let caller = get_caller_address();
            let mut product = self.products.read(product_id);
            
            assert(product.product_id != 0, 'Product does not exist');
            assert(product.seller == caller, 'Not product seller');
            assert(price > 0, 'Price must be greater than 0');
            
            product.price = price;
            product.inventory = inventory;
            self.products.write(product_id, product);
            
            self.emit(ProductUpdated {
                product_id: product_id,
                price: price,
                inventory: inventory,
            });
        }
        
        /// Deactivate product
        fn deactivate_product(ref self: ContractState, product_id: u256) {
            let caller = get_caller_address();
            let mut product = self.products.read(product_id);
            
            assert(product.product_id != 0, 'Product does not exist');
            assert(product.seller == caller, 'Not product seller');
            
            product.is_active = false;
            self.products.write(product_id, product);
            self.product_active.write(product_id, false);
            
            self.emit(ProductDeactivated { product_id: product_id });
        }
        
        /// Create an order (initiates payment)
        fn create_order(
            ref self: ContractState,
            product_id: u256,
            quantity: u256,
        ) -> u256 {
            let buyer = get_caller_address();
            let product = self.products.read(product_id);
            
            // Validate
            assert(product.product_id != 0, 'Product does not exist');
            assert(product.is_active, 'Product not active');
            assert(quantity > 0, 'Quantity must be positive');
            assert(product.inventory >= quantity, 'Insufficient inventory');
            assert(buyer != product.seller, 'Cannot buy own product');
            
            // Calculate total
            let total_price = product.price * quantity;
            
            // Create payment request via gateway
            let gateway = IPaymentGatewayDispatcher {
                contract_address: self.payment_gateway.read()
            };
            
            // Generate order ID for metadata
            let order_id = self.order_counter.read() + 1;
            let payment_id = gateway.create_payment(total_price, order_id.try_into().unwrap());
            
            // Create order
            let order = Order {
                order_id: order_id,
                product_id: product_id,
                buyer: buyer,
                seller: product.seller,
                quantity: quantity,
                total_price: total_price,
                payment_id: payment_id,
                status: OrderStatus::Pending,
                created_at: get_block_timestamp(),
                completed_at: 0,
            };
            
            self.orders.write(order_id, order);
            self.order_counter.write(order_id);
            
            // Add to buyer's order list
            let buyer_idx = self.buyer_order_count.read(buyer);
            self.buyer_orders.write((buyer, buyer_idx), order_id);
            self.buyer_order_count.write(buyer, buyer_idx + 1);
            
            // Add to seller's order list
            let seller_idx = self.seller_order_count.read(product.seller);
            self.seller_orders.write((product.seller, seller_idx), order_id);
            self.seller_order_count.write(product.seller, seller_idx + 1);
            
            // Emit event
            self.emit(OrderCreated {
                order_id: order_id,
                buyer: buyer,
                seller: product.seller,
                product_id: product_id,
                quantity: quantity,
                total_price: total_price,
                payment_id: payment_id,
                timestamp: get_block_timestamp(),
            });
            
            order_id
        }
        
        /// Confirm order payment (called after gateway payment)
        fn confirm_payment(ref self: ContractState, order_id: u256) {
            let caller = get_caller_address();
            let mut order = self.orders.read(order_id);
            
            assert(order.order_id != 0, 'Order does not exist');
            assert(order.buyer == caller, 'Not order buyer');
            assert(order.status == OrderStatus::Pending, 'Order not pending');
            
            // Verify payment was actually completed in the gateway
            let gateway = IPaymentGatewayDispatcher {
                contract_address: self.payment_gateway.read()
            };
            let payment = gateway.get_payment(order.payment_id);
            
            // Check payment status is Completed
            // PaymentStatus enum is accessible through the payment_gateway module
            use super::super::payment_gateway::PaymentGateway::PaymentStatus;
            assert(
                payment.status == PaymentStatus::Completed,
                'Payment not completed'
            );
            // Verify payment customer matches order buyer
            assert(payment.customer == caller, 'Payment customer mismatch');
            // Verify payment amount matches order total
            assert(payment.amount == order.total_price, 'Payment amount mismatch');
            
            // Update order status
            order.status = OrderStatus::Paid;
            self.orders.write(order_id, order);
            
            // Reduce inventory
            let mut product = self.products.read(order.product_id);
            product.inventory = product.inventory - order.quantity;
            self.products.write(order.product_id, product);
            
            self.emit(OrderPaid {
                order_id: order_id,
                timestamp: get_block_timestamp(),
            });
        }
        
        /// Mark order as shipped (seller only)
        fn mark_shipped(ref self: ContractState, order_id: u256) {
            let caller = get_caller_address();
            let mut order = self.orders.read(order_id);
            
            assert(order.order_id != 0, 'Order does not exist');
            assert(order.seller == caller, 'Not order seller');
            assert(order.status == OrderStatus::Paid, 'Order not paid');
            
            order.status = OrderStatus::Shipped;
            self.orders.write(order_id, order);
            
            self.emit(OrderShipped {
                order_id: order_id,
                timestamp: get_block_timestamp(),
            });
        }
        
        /// Mark order as delivered (buyer confirms)
        fn mark_delivered(ref self: ContractState, order_id: u256) {
            let caller = get_caller_address();
            let mut order = self.orders.read(order_id);
            
            assert(order.order_id != 0, 'Order does not exist');
            assert(order.buyer == caller, 'Not order buyer');
            assert(order.status == OrderStatus::Shipped, 'Order not shipped');
            
            order.status = OrderStatus::Delivered;
            order.completed_at = get_block_timestamp();
            self.orders.write(order_id, order);
            
            self.emit(OrderDelivered {
                order_id: order_id,
                timestamp: get_block_timestamp(),
            });
        }
        
        /// Get product details
        fn get_product(self: @ContractState, product_id: u256) -> Product {
            self.products.read(product_id)
        }
        
        /// Get order details
        fn get_order(self: @ContractState, order_id: u256) -> Order {
            self.orders.read(order_id)
        }
        
        /// Get seller's product count
        fn get_seller_product_count(self: @ContractState, seller: ContractAddress) -> u256 {
            self.seller_product_count.read(seller)
        }
        
        /// Get seller's product at index
        fn get_seller_product_at_index(
            self: @ContractState,
            seller: ContractAddress,
            index: u256
        ) -> u256 {
            self.seller_products.read((seller, index))
        }
        
        /// Get buyer's order count
        fn get_buyer_order_count(self: @ContractState, buyer: ContractAddress) -> u256 {
            self.buyer_order_count.read(buyer)
        }
        
        /// Get buyer's order at index
        fn get_buyer_order_at_index(
            self: @ContractState,
            buyer: ContractAddress,
            index: u256
        ) -> u256 {
            self.buyer_orders.read((buyer, index))
        }
        
        /// Get total products
        fn get_total_products(self: @ContractState) -> u256 {
            self.product_counter.read()
        }
        
        /// Get total orders
        fn get_total_orders(self: @ContractState) -> u256 {
            self.order_counter.read()
        }
    }
}

// ============ Interface ============
use starknet::ContractAddress;

#[starknet::interface]
trait IMarketplace<TContractState> {
    // Product functions
    fn list_product(
        ref self: TContractState,
        name: felt252,
        description: felt252,
        price: u256,
        inventory: u256,
        category: felt252,
    ) -> u256;
    fn update_product(ref self: TContractState, product_id: u256, price: u256, inventory: u256);
    fn deactivate_product(ref self: TContractState, product_id: u256);
    fn get_product(self: @TContractState, product_id: u256) -> Marketplace::Product;
    fn get_seller_product_count(self: @TContractState, seller: ContractAddress) -> u256;
    fn get_seller_product_at_index(
        self: @TContractState,
        seller: ContractAddress,
        index: u256
    ) -> u256;
    fn get_total_products(self: @TContractState) -> u256;
    
    // Order functions
    fn create_order(ref self: TContractState, product_id: u256, quantity: u256) -> u256;
    fn confirm_payment(ref self: TContractState, order_id: u256);
    fn mark_shipped(ref self: TContractState, order_id: u256);
    fn mark_delivered(ref self: TContractState, order_id: u256);
    fn get_order(self: @TContractState, order_id: u256) -> Marketplace::Order;
    fn get_buyer_order_count(self: @TContractState, buyer: ContractAddress) -> u256;
    fn get_buyer_order_at_index(
        self: @TContractState,
        buyer: ContractAddress,
        index: u256
    ) -> u256;
    fn get_total_orders(self: @TContractState) -> u256;
}
