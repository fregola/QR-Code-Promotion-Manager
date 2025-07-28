const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crea la directory uploads/logos se non esiste
const logoDir = path.join(__dirname, '../../../uploads/logos');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

// Configurazione storage per multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, logoDir);
  },
  filename: function (req, file, cb) {
    // Genera un nome file unico
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo file immagine sono permessi!'), false);
  }
};

// Configurazione multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: fileFilter
});

module.exports = upload;