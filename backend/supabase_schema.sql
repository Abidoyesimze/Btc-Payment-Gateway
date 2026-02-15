-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'MERCHANT', 'ADMIN');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'EXPIRED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- Create Users Table
CREATE TABLE "users" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "walletAddress" TEXT NOT NULL UNIQUE,
    "role" "Role" DEFAULT 'BUYER'::"Role" NOT NULL,
    "merchantName" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create Products Table
CREATE TABLE "products" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "onChainId" TEXT NOT NULL UNIQUE,
    "sellerId" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "images" TEXT[],
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create Orders Table
CREATE TABLE "orders" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "onChainId" TEXT NOT NULL UNIQUE,
    "buyerId" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "sellerId" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "paymentId" UUID UNIQUE, -- Circular dependency with payments, resolved later or nullable
    "totalAmount" BIGINT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3)
);

-- Create Order Items Table
CREATE TABLE "order_items" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "orderId" UUID NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "quantity" INTEGER NOT NULL,
    "price" BIGINT NOT NULL
);

-- Create Payments Table
CREATE TABLE "payments" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "onChainId" TEXT NOT NULL UNIQUE,
    "merchantId" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "customerId" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "amount" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "metadata" JSONB,
    "btcAddress" TEXT,
    "expiresAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Add Foreign Key for Order -> Payment
ALTER TABLE "orders" ADD CONSTRAINT "orders_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Add Foreign Key for Payment -> Order (Optional, if 1:1)
ALTER TABLE "payments" ADD COLUMN "orderId" UUID REFERENCES "orders"("id");

-- Create Analytics Table
CREATE TABLE "analytics" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "merchantId" TEXT NOT NULL, -- Stored as string in Prisma schema? No, relation implies UUID. Let's assume UUID but Prisma schema said String for merchantId? Check Schema.
    "date" TIMESTAMP(3) NOT NULL,
    "totalVolume" BIGINT NOT NULL,
    "paymentCount" INTEGER NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
-- Note: analytics.merchantId in Prisma schema was String but implied relation.
-- If it's a relation, it should be UUID. I'll assume UUID.
-- But wait, Prisma schema said: `merchantId String`, and `merchant User @relation(...)`. So it IS a foreign key to User.id (UUID).
-- So I should make it UUID.

-- Create Blockchain Events Table
CREATE TABLE "blockchain_events" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "eventName" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "processed" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");
CREATE INDEX "products_sellerId_idx" ON "products"("sellerId");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_isActive_idx" ON "products"("isActive");
CREATE INDEX "orders_buyerId_idx" ON "orders"("buyerId");
CREATE INDEX "orders_sellerId_idx" ON "orders"("sellerId");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
CREATE INDEX "payments_merchantId_idx" ON "payments"("merchantId");
CREATE INDEX "payments_customerId_idx" ON "payments"("customerId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");
CREATE INDEX "analytics_merchantId_idx" ON "analytics"("merchantId");
CREATE INDEX "analytics_date_idx" ON "analytics"("date");
CREATE UNIQUE INDEX "analytics_merchantId_date_key" ON "analytics"("merchantId", "date");
CREATE INDEX "blockchain_events_eventName_idx" ON "blockchain_events"("eventName");
CREATE INDEX "blockchain_events_processed_idx" ON "blockchain_events"("processed");
CREATE INDEX "blockchain_events_blockNumber_idx" ON "blockchain_events"("blockNumber");

-- Triggers for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updatedAt BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updatedAt BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updatedAt BEFORE UPDATE ON "orders" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updatedAt BEFORE UPDATE ON "payments" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
