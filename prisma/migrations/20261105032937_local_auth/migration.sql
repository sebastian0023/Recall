/*
  Warnings:

  - You are about to drop the column `cognitoSub` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_cognitoSub_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "cognitoSub",
ADD COLUMN     "passwordHash" TEXT;
