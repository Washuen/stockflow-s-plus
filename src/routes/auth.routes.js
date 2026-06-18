const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate } = require('../middlewares/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/auth.schemas');
const authService = require('../services/auth.service');

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data);
  res.status(201).json(result);
}));

router.post('/login', asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.json(result);
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json(authService.sanitizeUser(req.user));
}));

module.exports = router;
