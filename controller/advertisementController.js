const Advertisement = require('../model/advertisementModel');
const Product = require('../model/productModel');

/**
 * GET all advertisements
 * (Admins can see all; vendors see only their own ads; public see only active ads)
 */
exports.getAdvertisements = async (req, res) => {
  try {
    const filter = {};  
    if (req.user.role === 'vendor') {
      // Vendor sees their own ads
      filter.vendor = req.user.userId;
    } else if (req.user.role !== 'admin') {
      // Public or clients see only active ads
      filter.status = 'active';
    }
    const ads = await Advertisement.find(filter)
      .populate('product', 'name price images')
      .populate('vendor', 'username email');
    return res.status(200).json(ads);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch ads', error: err.message });
  }
};

/**
 * GET a single advertisement by ID
 */
exports.getAdvertisementById = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id)
      .populate('product', 'name price images')
      .populate('vendor', 'username email');
    if (!ad) return res.status(404).json({ message: 'Advertisement not found' });
    // If client/public, only allow active ones
    if (req.user.role === 'client' && ad.status !== 'active') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(200).json(ad);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch ad', error: err.message });
  }
};

/**
 * CREATE a new advertisement
 * Only vendors (or admins) may create, and ad.vendor must match req.user
 */
exports.createAdvertisement = async (req, res) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only vendors or admins can create ads' });
    }

    // Ensure product belongs to this vendor (unless admin)
    const product = await Product.findById(req.body.productId).populate({ path: 'owner', select: '_id' });
    if (!product) return res.status(400).json({ message: 'Invalid product ID' });
    if (req.user.role === 'vendor' && product.owner._id.toString() !== req.user.userId.toString()) {
      console.log(product.owner._id.toString(), req.user.userId.toString());
      return res.status(403).json({ message: 'Cannot advertise a product you do not own' });
    }

    const adData = {
      product:   req.body.productId,
      vendor:    req.user.userId,
      title:     req.body.title,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate:   req.body.endDate,
      budget:    req.body.budget,
      status:    req.body.status || 'pending'
    };

    console.log(adData, " Ad data ");

    const ad = new Advertisement(adData);
    await ad.save();
    return res.status(201).json(ad);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create ad', error: err.message });
  }
};

/**
 * UPDATE an advertisement by ID
 * Only vendor-owner or admin may update
 */
exports.updateAdvertisement = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Advertisement not found' });

    if (req.user.role === 'vendor' && ad.vendor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Cannot modify an ad you do not own' });
    }

    // Update allowed fields
    ['title','description','startDate','endDate','budget','status'].forEach(field => {
      if (req.body[field] !== undefined) ad[field] = req.body[field];
    });

    await ad.save();
    return res.status(200).json(ad);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update ad', error: err.message });
  }
};

/**
 * DELETE an advertisement by ID
 * Only vendor-owner or admin may delete
 */
exports.deleteAdvertisement = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Advertisement not found' });

    if (req.user.role === 'vendor' && ad.vendor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Cannot delete an ad you do not own' });
    }

    await Advertisement.deleteOne({ _id: ad._id });
    return res.status(200).json({ message: 'Advertisement deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete ad', error: err.message });
  }
};

// Approve an advertisement (Admin only)
exports.approveAdvertisement = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve advertisements' });
    }

    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    ad.status = 'active';
    await ad.save();

    res.status(200).json({ message: 'Advertisement approved successfully', ad });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve advertisement', details: err.message });
  }
};

// Delete an advertisement by Admin
exports.deleteAdvertisementByAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete advertisements' });
    }

    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    await Advertisement.deleteOne({ _id: ad._id });
    res.status(200).json({ message: 'Advertisement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete advertisement', details: err.message });
  }
};
