// routes/advertisementRoutes.js
const express                  = require('express');
const router                   = express.Router();
const verifyToken              = require('../middleware/verifyToken');
const advertisementController = require('../controller/AdvertisementController');

// All routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/ads
 * @desc    Get all advertisements
 *          - Admins see all
 *          - Vendors see only their own
 *          - Clients/public see only active
 */
router.get('/', advertisementController.getAdvertisements);

/**
 * @route   GET /api/ads/:id
 * @desc    Get a single advertisement by ID
 */
router.get('/:id', advertisementController.getAdvertisementById);

/**
 * @route   POST /api/ads
 * @desc    Create a new advertisement
 *          - Only vendors or admins
 */
router.post('/', advertisementController.createAdvertisement);

/**
 * @route   PUT /api/ads/:id
 * @desc    Update an existing advertisement
 *          - Only the owning vendor or admin
 */
router.put('/:id', advertisementController.updateAdvertisement);

/**
 * @route   DELETE /api/ads/:id
 * @desc    Delete an advertisement
 *          - Only the owning vendor or admin
 */
router.delete('/:id', advertisementController.deleteAdvertisement);

/**
 * @route   PUT /api/ads/:id/approve
 * @desc    Approve an advertisement
 *          - Only admins
 */
router.put('/:id/approve', verifyToken, advertisementController.approveAdvertisement);

/**
 * @route   DELETE /api/ads/:id
 * @desc    Delete an advertisement by admin
 *          - Only admins
 */
router.delete('/:id', verifyToken, advertisementController.deleteAdvertisementByAdmin);

module.exports = router;
