const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Carica le variabili d'ambiente - prima prova .env.local, poi .env
dotenv.config({ path: '.env.local' });
if (!process.env.MONGO_URI) {
  dotenv.config(); // fallback al .env normale
}

// Connessione al database
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configurazione CORS dinamica per locale e server
const corsOptions = {
  origin: function (origin, callback) {
    // Permetti richieste senza origin (es. app mobile, Postman)
    if (!origin) return callback(null, true);
    
    // Lista domini permessi
    const allowedOrigins = [
      'http://localhost:3000',  // Frontend locale
      'http://localhost:8000',  // Backend locale  
      'http://84.247.137.249',  // Server IP
      'http://84.247.137.249:3000', // Server con porta
    ];
    
    // In sviluppo permetti tutti i localhost
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost')) {
        return callback(null, true);
      }
    }
    
    // Controlla se origin è permesso
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/uploads/logos', express.static(path.join(__dirname, '../../uploads/logos')));

// Definizione delle routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/qrcodes', require('./routes/qrcodes'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});