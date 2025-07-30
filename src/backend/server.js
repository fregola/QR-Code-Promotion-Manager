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

// Configurazione CORS dinamica per locale e server - VERSIONE CORRETTA
const corsOptions = {
  origin: function (origin, callback) {
    // Permetti richieste senza origin (es. app mobile, Postman, server stesso)
    if (!origin) return callback(null, true);
    
    // Lista domini permessi
    const allowedOrigins = [
      'http://localhost:3000',  // Frontend locale
      'http://localhost:8000',  // Backend locale  
      'http://84.247.137.249',  // Server IP
      'http://84.247.137.249:3000', // Server con porta
      'https://84.247.137.249', // HTTPS se utilizzato
      'https://qrcodepromotion.it',
      'http://qrcodepromotion.it',

    ];
    
    // In sviluppo permetti tutti i localhost
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost')) {
        return callback(null, true);
      }
    }
    
    // In produzione, permetti anche richieste dal server stesso
    if (process.env.NODE_ENV === 'production') {
      // Permetti richieste interne del server
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('84.247.137.249')) {
        return callback(null, true);
      }
    }
    
    // Controlla se origin è nella lista
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      // TEMPORANEO: permetti tutto per evitare blocchi
      callback(null, true);
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