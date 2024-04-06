-- CreateTable
CREATE TABLE "User" (
    "id" INT4 NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    "name" STRING NOT NULL,
    "email" STRING NOT NULL,
    "password" STRING NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" INT4 NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "condition" STRING NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING NOT NULL,
    "cost" FLOAT8 NOT NULL,
    "photo" STRING NOT NULL,
    "postedbyid" INT4 NOT NULL,
    "productid" INT4 NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" INT4 NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" STRING NOT NULL,
    "content" STRING NOT NULL,
    "rating" INT4 NOT NULL,
    "postedbyid" INT4 NOT NULL,
    "productid" INT4 NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INT4 NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    "name" STRING NOT NULL,
    "category" STRING NOT NULL,
    "photo" STRING NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_postedbyid_fkey" FOREIGN KEY ("postedbyid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_productid_fkey" FOREIGN KEY ("productid") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_postedbyid_fkey" FOREIGN KEY ("postedbyid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productid_fkey" FOREIGN KEY ("productid") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;