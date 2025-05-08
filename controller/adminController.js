const User = require("../model/userModel");

// Get all vendors
exports.getVendors = async (req, res) => {
    try {
      const vendors = await User.find({ role: "vendor" });
      res.json(vendors);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
// Get all clients
exports.getClients = async (req, res) => {
    try {
      const clients = await User.find({ role: "client" });
      res.json(clients);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
  // Approve vendor (if you have a pending/approved system)
exports.approveVendor = async (req, res) => {
  const { id } = req.params;
  const vendor = await User.findByIdAndUpdate(id, { approved: true }, { new: true });
  res.json(vendor);
};

// Delete vendor/client
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted" });
};

// GET /api/admin/user-stats
exports.getUserStats = async (req, res) => {
    try {
      const clients = await User.countDocuments({ role: "client" });
      const vendors = await User.countDocuments({ role: "vendor" });
      res.json({ clients, vendors });
    } catch (err) {
      res.status(500).json({ error: "Error fetching user stats" });
    }
  };
  
  // GET /api/admin/product-stats
  exports.getProductStats = async (req, res) => {
    try {
      const count = await Product.countDocuments();
      res.json({ count });
    } catch (err) {
      res.status(500).json({ error: "Error fetching product stats" });
    }
  };
  
  // GET /api/admin/order-stats
  exports.getOrderStats = async (req, res) => {
    try {
      const count = await Order.countDocuments();
      res.json({ count });
    } catch (err) {
      res.status(500).json({ error: "Error fetching order stats" });
    }
  };
  
  // GET /api/admin/recent-users
  exports.getRecentUsers = async (req, res) => {
    try {
      const users = await User.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select("name username email role createdAt");
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Error fetching recent users" });
    }
  };