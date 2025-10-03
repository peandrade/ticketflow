-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "fee_cents" INTEGER,
ADD COLUMN     "kind" TEXT,
ADD COLUMN     "seat_type" TEXT,
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "unit_price_cents" INTEGER;
