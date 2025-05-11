const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Check if this field is for video or image
    if (file.fieldname === 'video') {
      return {
        folder: 'products',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mkv', 'avi', 'mov'],
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
      };
    }
    return {
      folder: 'products',
      resource_type: 'image',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

const parser = multer({ storage: storage });
module.exports = parser;