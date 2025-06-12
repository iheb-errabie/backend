const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const parser = require('../middleware/cloudinaryUpload');
const productController = require('../controller/productController');

// 1) PUBLIC READ routes
router.get('/', productController.getProducts);
router.get('/vistorproducts', productController.getProducts);
router.get('/:id', productController.getProductById);

// 2) PROTECTED WRITE routes (with file uploads)
router.post(
  '/',
  verifyToken,
  parser.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
  ]),
  productController.createProduct
);
router.put(
  '/:id',
  verifyToken,
  parser.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
  ]),
  productController.updateProduct
);
router.delete(
  '/:id',
  verifyToken,
  productController.deleteProduct
);
router.get(
  '/vendor/:vendorId',
  verifyToken,
  productController.getProductsByVendor
);
router.get(
  '/category/:category',
  verifyToken,
  (req, res, next) => {
    if (!req.params.category) {
      return res.status(400).send('Category parameter is required');
    }
    next();
  },
  productController.getProductsByCategory
);
router.post(
  '/:id/reviews',
  verifyToken,
  productController.addReview
);

router.get(
  '/:id/reviews',
  verifyToken,
  productController.getProductReviews
);

router.put(
  '/:id/reviews/:reviewId',
  verifyToken,
  productController.updateReview
);

module.exports = router;