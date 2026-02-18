# Frontend Implementation Guide
**BTC Payment Gateway on Starknet**

---

## 📋 Current State

### ✅ What's Already Set Up

**Tech Stack**:
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Starknet.js v9
- React Query (TanStack)
- Zustand (State Management)
- Axios (HTTP Client)

**Existing Structure**:
```
web/
├── app/
│   ├── page.tsx              # Homepage (7.6KB - partially built)
│   ├── dashboard/            # Dashboard page (empty)
│   └── layout.tsx            # Root layout
├── lib/
│   ├── api/                  # API client setup ✅
│   ├── starknet/             # Wallet integration ✅
│   ├── store/                # Zustand stores (auth, cart) ✅
│   ├── types/                # TypeScript types ✅
│   └── config.ts             # Environment config ✅
└── components/
    ├── dashboard/            # Wallet guards ✅
    └── ui/                   # Basic UI components ✅
```

**Key Files Already Configured**:
- `lib/config.ts` - API & Starknet config
- `lib/api/client.ts` - Axios instance
- `lib/starknet/wallet.ts` - Wallet connection
- `lib/starknet/auth.ts` - Authentication flow
- `lib/store/auth.ts` - Auth state management

---

## 🎯 What Needs to Be Built

### Required Pages

1. **Homepage** (`app/page.tsx`) - ⚠️ Partially done
   - Hero section
   - Features showcase
   - How it works
   - CTA to marketplace

2. **Marketplace** (`app/marketplace/page.tsx`) - ❌ Not started
   - Product grid with filters
   - Search functionality
   - Product cards (image, name, price, stock)
   - "Add to Cart" buttons

3. **Product Details** (`app/marketplace/[id]/page.tsx`) - ❌ Not started
   - Product images
   - Description
   - Price & stock
   - Seller info
   - "Buy Now" / "Add to Cart"

4. **Cart** (`app/cart/page.tsx`) - ❌ Not started
   - Cart items list
   - Quantity controls
   - Total calculation
   - "Checkout" button

5. **Checkout** (`app/checkout/page.tsx`) - ❌ Not started
   - Order summary
   - Payment flow (Starknet transaction)
   - QR code for BTC payment
   - Order confirmation

6. **Dashboard** (`app/dashboard/page.tsx`) - ❌ Not started
   - **Buyer View**:
     - My orders
     - Order status tracking
   - **Seller View**:
     - Add product form
     - My products list
     - Sales history
     - Revenue stats

7. **Orders** (`app/orders/[id]/page.tsx`) - ❌ Not started
   - Order details
   - Payment status
   - Blockchain transaction link

---

## 🔌 Backend API Integration

### Base URL
```typescript
// Already configured in lib/config.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
```

### Authentication Flow

**1. Connect Wallet & Login**
```typescript
import { connectWallet, login } from '@/lib/starknet/auth';

// User clicks "Connect Wallet"
const wallet = await connectWallet();

// Sign message and login
const { access_token, user } = await login(wallet);

// Token is auto-stored in localStorage
// All subsequent API calls include it automatically
```

**2. API Client Usage**
```typescript
import { apiClient } from '@/lib/api/client';

// GET request (token auto-included)
const products = await apiClient.get('/products');

// POST request
const order = await apiClient.post('/orders', {
  productId: '123',
  quantity: 2
});
```

### API Endpoints Reference

#### **Auth**
```typescript
POST /auth/login
Body: { walletAddress, signature, typedData }
Response: { access_token, user }
```

#### **Products**
```typescript
GET /products                    # List all products
GET /products/:id                # Get single product
POST /products                   # Create product (seller only)
PATCH /products/:id              # Update product
DELETE /products/:id             # Delete product
```

#### **Orders**
```typescript
GET /orders                      # My orders
GET /orders/:id                  # Order details
POST /orders                     # Create order
Body: {
  productId: string,
  quantity: number,
  buyerId: string
}
```

#### **Payments**
```typescript
GET /payments                    # My payments
GET /payments/:id                # Payment details
POST /payments                   # Create payment
```

#### **Merchants**
```typescript
GET /merchants/profile           # My merchant profile
PATCH /merchants/profile         # Update profile
GET /merchants/dashboard         # Dashboard stats
Response: {
  totalRevenue: number,
  totalPayments: number,
  totalProducts: number
}
```

---

## 🎨 UI/UX Requirements

### Design System
- **Colors**: Use Tailwind's default palette or define custom theme
- **Typography**: Inter or similar modern font
- **Components**: Build reusable components in `components/ui/`
  - Button (already exists)
  - Card (already exists)
  - Input
  - Modal
  - Table
  - Badge (for order status)

### Key Features

**Wallet Integration**:
- "Connect Wallet" button in navbar
- Show connected address (truncated: `0x1234...5678`)
- Disconnect option
- Auto-reconnect on page refresh

**Product Cards**:
```tsx
<ProductCard
  image="/product.jpg"
  name="Bitcoin Miner S19"
  price="0.5 BTC"
  stock={10}
  onAddToCart={() => {}}
/>
```

**Order Status Badges**:
- PENDING → Yellow
- PAID → Blue
- SHIPPED → Purple
- DELIVERED → Green
- CANCELLED → Red

**Payment Flow**:
1. User clicks "Checkout"
2. Show order summary
3. "Pay with Starknet" button
4. Trigger smart contract transaction
5. Show loading state
6. On success → redirect to order confirmation
7. Display blockchain transaction hash

---

## 📝 Step-by-Step Implementation

### Phase 1: Core Pages (Week 1)

**Day 1-2: Marketplace**
1. Create `app/marketplace/page.tsx`
2. Fetch products from `/products` API
3. Display in grid layout
4. Add search/filter UI
5. Implement "Add to Cart" (update Zustand store)

**Day 3: Product Details**
1. Create `app/marketplace/[id]/page.tsx`
2. Fetch single product from `/products/:id`
3. Display full details
4. Add quantity selector
5. "Buy Now" → redirect to checkout

**Day 4: Cart & Checkout**
1. Create `app/cart/page.tsx`
2. Read from cart store
3. Show items, quantities, total
4. Create `app/checkout/page.tsx`
5. Call `/orders` API to create order
6. Integrate Starknet payment transaction

**Day 5: Orders**
1. Create `app/orders/page.tsx`
2. Fetch from `/orders` API
3. Display order history
4. Create `app/orders/[id]/page.tsx` for details

### Phase 2: Dashboard (Week 2)

**Day 6-7: Buyer Dashboard**
1. Update `app/dashboard/page.tsx`
2. Show recent orders
3. Order tracking UI

**Day 8-9: Seller Dashboard**
1. Add product creation form
2. Call `/products` POST endpoint
3. Display seller's products
4. Edit/delete functionality
5. Fetch `/merchants/dashboard` for stats

**Day 10: Polish**
1. Add loading states
2. Error handling
3. Toast notifications
4. Responsive design fixes

---

## 🔐 Environment Variables

Create `.env.local`:
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Starknet
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
NEXT_PUBLIC_PAYMENT_GATEWAY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_WBTC_TOKEN_ADDRESS=0x...
```

---

## 🚀 Getting Started

```bash
cd web

# Install dependencies (already done)
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📚 Code Examples

### Fetching Products
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export default function MarketplacePage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      return res.data;
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
```

### Creating Order
```typescript
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';

const createOrder = useMutation({
  mutationFn: async (data) => {
    return apiClient.post('/orders', data);
  },
  onSuccess: (response) => {
    // Redirect to payment
    router.push(`/checkout/${response.data.id}`);
  }
});

// Usage
const handleCheckout = () => {
  createOrder.mutate({
    productId: product.id,
    quantity: 2,
    buyerId: user.id
  });
};
```

### Wallet Connection
```typescript
import { useWallet } from '@/lib/starknet/wallet';

export function ConnectButton() {
  const { connect, disconnect, account, isConnected } = useWallet();

  if (isConnected) {
    return (
      <button onClick={disconnect}>
        {account.slice(0, 6)}...{account.slice(-4)}
      </button>
    );
  }

  return <button onClick={connect}>Connect Wallet</button>;
}
```

---

## ✅ Checklist

- [ ] Marketplace page with product grid
- [ ] Product details page
- [ ] Shopping cart functionality
- [ ] Checkout flow with Starknet payment
- [ ] Order history page
- [ ] Seller dashboard (add/edit products)
- [ ] Buyer dashboard (track orders)
- [ ] Wallet connection UI
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design
- [ ] Toast notifications

---

## 🐛 Common Issues

**"API call fails with 401"**
→ Check if JWT token is in localStorage
→ Verify `Authorization` header is set in axios interceptor

**"Wallet not connecting"**
→ Ensure user has ArgentX or Braavos installed
→ Check Starknet network matches backend (sepolia)

**"Transaction fails"**
→ Verify contract addresses in `.env.local`
→ Check user has enough funds for gas

---

## 📞 Backend Contact

Backend is running at: `http://localhost:3000/api`

API Docs (Swagger): `http://localhost:3000/api/docs`

If backend is not running:
```bash
cd ../backend
npm run start:dev
```
