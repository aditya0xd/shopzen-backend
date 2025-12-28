const prisma = require("../src/utils/prisma");
const dummyData = require("./dummy-products.json"); // paste JSON here or import

async function main() {
  console.log("🚀 Import started...");

  for (const product of dummyData.products) {
    // 1️⃣ Create product
    const createdProduct = await prisma.product.create({
      data: {
        title: product.title,
        description: product.description,
        category: product.category,
        brand: product.brand || "Unknown",
        sku: product.sku,

        price: product.price,
        discountPercentage: product.discountPercentage,
        stock: product.stock,
        minimumOrderQuantity: product.minimumOrderQuantity,
        availabilityStatus: product.availabilityStatus,

        tags: product.tags,
        images: product.images,
        thumbnail: product.thumbnail,

        dimensions: product.dimensions,
        meta: product.meta,

        warrantyInformation: product.warrantyInformation,
        shippingInformation: product.shippingInformation,
        returnPolicy: product.returnPolicy,

        // rating will be updated after reviews
        rating: 0,
      },
    });

    // 2️⃣ Insert reviews
    if (product.reviews && product.reviews.length > 0) {
      let totalRating = 0;

      for (const review of product.reviews) {
        totalRating += review.rating;

        await prisma.review.create({
          data: {
            rating: review.rating,
            comment: review.comment,
            reviewerName: review.reviewerName,
            reviewerEmail: review.reviewerEmail,
            productId: createdProduct.id,
          },
        });
      }

      // 3️⃣ Update average rating
      const avgRating = totalRating / product.reviews.length;

      await prisma.product.update({
        where: { id: createdProduct.id },
        data: {
          rating: Number(avgRating.toFixed(2)),
        },
      });
    }
  }

  console.log("✅ Import completed");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
