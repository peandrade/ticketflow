-- CreateEnum
CREATE TYPE "public"."VariantKind" AS ENUM ('FULL', 'HALF', 'ELDERLY', 'PCD');

-- CreateTable
CREATE TABLE "public"."TicketVariant" (
    "id" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "kind" "public"."VariantKind" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "discountPct" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventory" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TicketVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketVariant_ticketTypeId_idx" ON "public"."TicketVariant"("ticketTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketVariant_ticketTypeId_kind_key" ON "public"."TicketVariant"("ticketTypeId", "kind");

-- AddForeignKey
ALTER TABLE "public"."TicketVariant" ADD CONSTRAINT "TicketVariant_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "public"."TicketType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
