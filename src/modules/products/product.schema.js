const { z } = require("zod");

const dimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
});

const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5).optional(),

  category: z.string().min(2),
  brand: z.string().min(1),
  sku: z.string().min(3),

  price: z.number().positive(),
  discountPercentage: z.number().min(0).max(100).optional(),
  rating: z.number().min(0).max(5).optional(),

  stock: z.number().int().nonnegative(),
  minimumOrderQuantity: z.number().int().positive(),

  availabilityStatus: z.string(),

  warrantyInformation: z.string().optional(),
  shippingInformation: z.string().optional(),
  returnPolicy: z.string().optional(),

  weight: z.number().positive().optional(),

  tags: z.array(z.string().min(1)).min(1),
  images: z.array(z.string().url()).min(1),
  thumbnail: z.string().url(),

  dimensions: dimensionsSchema,
  meta: z.record(z.any()),
});
