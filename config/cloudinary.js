const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dolq2esig',
  api_key: '219117194871828',
  api_secret: '0vGnmNjY536A_kbCaw7AEzLoix4'
});

module.exports = cloudinary;