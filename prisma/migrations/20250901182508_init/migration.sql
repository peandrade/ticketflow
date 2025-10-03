/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Venue` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Venue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Venue" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "public"."Venue"("slug");
