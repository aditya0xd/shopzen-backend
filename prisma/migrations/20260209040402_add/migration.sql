-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastOAuthLogin" TIMESTAMP(3),
ADD COLUMN     "oauthProvider" TEXT,
ADD COLUMN     "picture" TEXT;
