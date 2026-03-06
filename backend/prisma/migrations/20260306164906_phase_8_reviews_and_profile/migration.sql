-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCountry" TEXT,
ADD COLUMN     "shippingDeliveryInstructions" TEXT,
ADD COLUMN     "shippingName" TEXT,
ADD COLUMN     "shippingPhone" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT,
ADD COLUMN     "shippingStreetLine1" TEXT,
ADD COLUMN     "shippingStreetLine2" TEXT;
