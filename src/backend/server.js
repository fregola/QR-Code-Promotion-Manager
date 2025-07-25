const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const { activityLogger } = require('./middleware/activityLogger'); // ← AGGIUNTO

// Carica le variabili d'ambiente
dotenv.config();

// Connessione al database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(activityLogger()); // ← AGGIUNTO

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Definizione delle routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/qrcodes', require('./routes/qrcodes'));
app.use('/api/plans', require('./routes/planLimits'));
app.use("/api/admin", require("./routes/superAdmin"));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🔍 Activity logging system: ACTIVE`); // ← AGGIUNTO
});