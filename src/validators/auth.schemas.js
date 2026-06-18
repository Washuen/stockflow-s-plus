const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(2).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'STOCK', 'SALES', 'FINANCE'])
});

const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'STOCK', 'SALES', 'FINANCE'])
});

module.exports = {
  registerSchema,
  loginSchema,
  createUserSchema,
  updateUserRoleSchema
};
