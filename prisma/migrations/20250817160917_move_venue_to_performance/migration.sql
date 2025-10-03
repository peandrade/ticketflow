/*
  Warnings:

  - You are about to drop the column `venueId` on the `Event` table. All the data in the column will be lost.
  - Added the required column `venueId` to the `Performance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Event" DROP CONSTRAINT "Event_venueId_fkey";

-- DropIndex
DROP INDEX "public"."Event_venueId_idx";

-- DropIndex
DROP INDEX "public"."Performance_eventId_startsAt_idx";

-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "venueId";

-- AlterTable
ALTER TABLE "public"."Performance" ADD COLUMN     "venueId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Performance_startsAt_venueId_idx" ON "public"."Performance"("startsAt", "venueId");

-- AddForeignKey
ALTER TABLE "public"."Performance" ADD CONSTRAINT "Performance_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
