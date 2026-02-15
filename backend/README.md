# BTC Payment Gateway - Backend

Bitcoin Payment Gateway on Starknet - Backend API Server

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: Supabase (PostgreSQL via HTTP API)
- **Blockchain**: Starknet.js v9
- **Authentication**: JWT + Starknet Wallet Signatures
- **Documentation**: Swagger/OpenAPI (auto-generated)

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase Account (free tier works)
- Starknet RPC Access (Alchemy/Infura)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

### Database Setup

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project
2. **Run Schema**: Copy contents of `supabase_schema.sql` and paste into Supabase Dashboard → SQL Editor → Run
3. **Get Credentials**: Copy your Supabase URL and Anon Key to `.env`

### Running the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod

# Verify backend connectivity
npx ts-node scripts/verify-backend.ts
```

The API will be available at `http://localhost:3000/api`

API Documentation: `http://localhost:3000/api/docs`

## Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── common/
│   │   └── supabase/              # Supabase client service
│   └── modules/
│       ├── auth/                  # Starknet wallet authentication
│       ├── payments/              # Payment management
│       ├── products/              # Product catalog
│       ├── orders/                # Order management
│       ├── merchants/             # Merchant operations
│       └── blockchain/            # Starknet integration
│           ├── abis/              # Contract ABIs
│           ├── starknet.service.ts
│           └── event-listener.service.ts
├── scripts/
│   └── verify-backend.ts          # Infrastructure verification
├── supabase_schema.sql            # Database schema (run in Supabase)
└── test/                          # Tests
```

## Environment Variables

Required variables in `.env`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Starknet
STARKNET_NETWORK=sepolia
STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/...
PAYMENT_GATEWAY_ADDRESS=0x...  # Your deployed contract

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# API
PORT=3000
```

## Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npx ts-node scripts/verify-backend.ts` - Verify database & blockchain connectivity

## API Documentation

Once the server is running, visit `/api/docs` for interactive Swagger documentation.

## Architecture

### Database Layer
- **Supabase Client**: HTTP-based database access (no direct TCP connection needed)
- **Tables**: users, products, orders, order_items, payments, analytics, blockchain_events
- **Auto-timestamps**: Triggers handle `updatedAt` on UPDATE operations

### Blockchain Layer
- **Starknet Service**: RPC provider for blockchain queries
- **Event Listener**: Processes `PaymentCreated` and `PaymentCompleted` events
- **Contract Integration**: Real ABI-based contract interaction

### Authentication
- Starknet signature verification using `starknet.js`
- JWT tokens for session management
- Role-based access control (BUYER, SELLER, MERCHANT, ADMIN)

## Development Status

- ✅ Project structure initialized
- ✅ Database schema defined (Supabase)
- ✅ Supabase integration complete
- ✅ Authentication module (Starknet signatures)
- ✅ Payment module
- ✅ Order management
- ✅ Product catalog
- ✅ Merchant dashboard
- ✅ Blockchain integration (Starknet)
- ✅ Event listener service
- ✅ Infrastructure verified (DB + RPC working)

## Testing

Run the verification script to confirm your setup:

```bash
npx ts-node scripts/verify-backend.ts
```

This will:
- ✅ Test Supabase connection (insert/read/delete)
- ✅ Test Starknet RPC connection (fetch latest block)
- Show you exactly what's working

## License

ISC
