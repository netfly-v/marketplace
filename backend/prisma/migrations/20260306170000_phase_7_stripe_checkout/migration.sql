-- AlterTable
ALTER TABLE "orders"
ADD COLUMN "recipientName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "streetLine1" TEXT,
ADD COLUMN "streetLine2" TEXT,
ADD COLUMN "postalCode" TEXT,
ADD COLUMN "deliveryInstructions" TEXT;

-- Backfill existing orders so the transition to structured shipping fields is data-safe.
UPDATE "orders"
SET
  "recipientName" = 'Existing customer',
  "phone" = 'Not provided',
  "country" = 'Unknown',
  "city" = COALESCE(NULLIF("shippingAddress", ''), 'Unknown city'),
  "streetLine1" = COALESCE(NULLIF("shippingAddress", ''), 'Unknown address'),
  "postalCode" = 'N/A'
WHERE "recipientName" IS NULL;

-- Make the new required fields non-nullable after backfill.
ALTER TABLE "orders"
ALTER COLUMN "recipientName" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "streetLine1" SET NOT NULL,
ALTER COLUMN "postalCode" SET NOT NULL;

-- Remove the old single-string address once the structured snapshot is populated.
ALTER TABLE "orders"
DROP COLUMN "shippingAddress";

-- AlterTable
ALTER TABLE "payments"
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'usd';

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeCheckoutSessionId_key"
ON "payments"("stripeCheckoutSessionId");
