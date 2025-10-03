/*
  Warnings:

  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Session_tokenHash_key";

-- AlterTable
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("tokenHash");

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "password",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");
