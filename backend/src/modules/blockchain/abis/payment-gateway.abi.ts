export const PAYMENT_GATEWAY_ABI = [
  {
    "type": "function",
    "name": "create_payment",
    "inputs": [
      { "name": "amount", "type": "core::integer::u256" },
      { "name": "metadata", "type": "core::felt252" }
    ],
    "outputs": [{ "type": "core::integer::u256" }],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "pay",
    "inputs": [{ "name": "payment_id", "type": "core::integer::u256" }],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "cancel_payment",
    "inputs": [{ "name": "payment_id", "type": "core::integer::u256" }],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "get_payment",
    "inputs": [{ "name": "payment_id", "type": "core::integer::u256" }],
    "outputs": [
      {
        "type": "struct",
        "name": "payment_gateway::PaymentGateway::Payment",
        "members": [
          { "name": "payment_id", "type": "core::integer::u256" },
          { "name": "merchant", "type": "core::starknet::contract_address::ContractAddress" },
          { "name": "customer", "type": "core::starknet::contract_address::ContractAddress" },
          { "name": "amount", "type": "core::integer::u256" },
          { "name": "fee", "type": "core::integer::u256" },
          { "name": "status", "type": "enum", "variants": [] },
          { "name": "created_at", "type": "core::integer::u64" },
          { "name": "paid_at", "type": "core::integer::u64" },
          { "name": "metadata", "type": "core::felt252" }
        ]
      }
    ],
    "state_mutability": "view"
  },
  {
    "type": "event",
    "name": "payment_gateway::PaymentGateway::PaymentCreated",
    "kind": "struct",
    "members": [
      { "name": "payment_id", "type": "core::integer::u256", "kind": "key" },
      { "name": "merchant", "type": "core::starknet::contract_address::ContractAddress", "kind": "key" },
      { "name": "customer", "type": "core::starknet::contract_address::ContractAddress", "kind": "key" },
      { "name": "amount", "type": "core::integer::u256", "kind": "data" },
      { "name": "metadata", "type": "core::felt252", "kind": "data" },
      { "name": "timestamp", "type": "core::integer::u64", "kind": "data" }
    ]
  },
  {
    "type": "event",
    "name": "payment_gateway::PaymentGateway::PaymentCompleted",
    "kind": "struct",
    "members": [
      { "name": "payment_id", "type": "core::integer::u256", "kind": "key" },
      { "name": "merchant", "type": "core::starknet::contract_address::ContractAddress", "kind": "key" },
      { "name": "amount_to_merchant", "type": "core::integer::u256", "kind": "data" },
      { "name": "fee", "type": "core::integer::u256", "kind": "data" },
      { "name": "timestamp", "type": "core::integer::u64", "kind": "data" }
    ]
  }
];
