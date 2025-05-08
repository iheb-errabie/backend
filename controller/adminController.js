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
  const clients = await User.find({ role: "client" });
  res.json(clients);
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

