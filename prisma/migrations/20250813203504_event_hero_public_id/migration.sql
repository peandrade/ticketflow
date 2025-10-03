/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "imageUrl",
ADD COLUMN     "heroPublicId" TEXT;
