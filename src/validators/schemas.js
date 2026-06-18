const { z } = require('zod');

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  price: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
  categoryId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable()
});

const stockMovementSchema = z.object({
  productId: z.string(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive(),
  reason: z.string().optional()
});

const saleSchema = z.object({
  customerName: z.string().min(2),
  discount: z.number().nonnegative().optional().default(0),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive()
  })).min(1)
});

const expenseSchema = z.object({
  description: z.string().min(2),
  category: z.string().min(2),
  amount: z.number().nonnegative(),
  status: z.enum(['PAID', 'PENDING', 'CANCELED']).optional().default('PENDING'),
  dueDate: z.string().optional().nullable()
});

module.exports = {
  productSchema,
  stockMovementSchema,
  saleSchema,
  expenseSchema
};
