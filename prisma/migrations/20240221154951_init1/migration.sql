/*
  Warnings:

  - Added the required column `title` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterSequence
ALTER SEQUENCE "Listing_id_seq" MAXVALUE 9223372036854775807;

-- AlterSequence
ALTER SEQUENCE "Product_id_seq" MAXVALUE 9223372036854775807;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "title" STRING NOT NULL;
