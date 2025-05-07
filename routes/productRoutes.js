const express           = require('express');
const router            = express.Router();
const verifyToken       = require('../middleware/verifyToken');
const upload            = require('../middleware/upload');
const productController = require('../controller/productController');

// 1) PROTECTED READ routes
router.get(
  '/',
  verifyToken,                  // must be logged in
  productController.getProducts
);


router.get(
  '/:id',
  verifyToken,                  // must be logged in
  productController.getProductById
);

// 2) PROTECTED WRITE routes (with file uploads)
router.post(
  '/',
  verifyToken,                  // must be logged in
  upload.fields([
    { name: 'images', maxCount: 5 }, // Ensure the field name matches the form-data key
    { name: 'video',  maxCount: 1 }  // Ensure the field name matches the form-data key
  ]),
  productController.createProduct
);

router.put(
  '/:id',
  verifyToken,                  // must be logged in
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video',  maxCount: 1 }
  ]),
  productController.updateProduct
);

// 3) PROTECTED DELETE route
router.delete(
  '/:id',
  verifyToken,                  // must be logged in
  productController.deleteProduct
);
// ← New route for vendor’s products
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

// Add route for adding reviews to a product
router.post(
  '/:id/reviews',
  verifyToken, // must be logged in
  productController.addReview
);

module.exports = router;

