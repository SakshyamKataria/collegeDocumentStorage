const multer = require('multer');

// Configure multer to store files in memory temporarily 
// at the gateway before forwarding to the storage nodes
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 52428800 // 50MB
  }
});

module.exports = upload;
