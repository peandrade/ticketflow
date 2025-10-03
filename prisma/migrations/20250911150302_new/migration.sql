/*
  Warnings:

  - A unique constraint covering the columns `[orderId,variantId]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `variantId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."OrderItem_orderId_ticketTypeId_key";

-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "variantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "public"."OrderItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_variantId_key" ON "public"."OrderItem"("orderId", "variantId");

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."TicketVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
