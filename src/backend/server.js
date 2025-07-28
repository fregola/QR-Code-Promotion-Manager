const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Carica le variabili d'ambiente
dotenv.config();

// Connessione al database
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

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