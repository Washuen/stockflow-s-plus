const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');
const { productSchema } = require('../validators/schemas');
const productService = require('../services/product.service');

const router = express.Router();

router.get('/', authorize('products:read'), asyncHandler(async (req, res) => {
  const products = await productService.listProducts(req.companyId, req.query);
  res.json(products);
}));

router.get('/:id', authorize('products:read'), asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.companyId, req.params.id);
  res.json(product);
}));

router.post('/', authorize('products:create'), asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body);
  const product = await productService.createProduct(req.companyId, data);
  res.status(201).json(product);
}));

router.patch('/:id', authorize('products:update'), asyncHandler(async (req, res) => {
  const data = productSchema.partial().parse(req.body);
  const product = await productService.updateProduct(req.companyId, req.params.id, data);
  res.json(product);
}));

router.patch('/:id/deactivate', authorize('products:delete'), asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.companyId, req.params.id);
  res.json(result);
}));

router.patch('/:id/reactivate', authorize('products:delete'), asyncHandler(async (req, res) => {
  const result = await productService.reactivateProduct(req.companyId, req.user.id, req.params.id);
  res.json(result);
}));

router.delete('/:id', authorize('products:delete'), asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.companyId, req.params.id);
  res.json(product);
}));

module.exports = router;