const mongoose = require('mongoose');
require('dotenv').config();
const { initializeMonthlyCountsForAllUsers } = require('./src/backend/utils/updateCounters');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

const runScript = async () => {
  try {
    await connectDB();
    console.log('🔄 Inizializzazione contatori mensili per tutti gli utenti...');
    
    const results = await initializeMonthlyCountsForAllUsers();
    
    console.log('\n📊 Risultati inizializzazione:');
    results.forEach(result => {
      console.log(`User: ${result.email}`);
      console.log(`  - Promozioni mensili: ${result.counts.promotions.monthly}/${result.counts.promotions.total}`);
      console.log(`  - QR codes mensili: ${result.counts.qrCodes.monthly}/${result.counts.qrCodes.total}`);
    });
    
    console.log('\n🎉 Inizializzazione completata!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error);
    process.exit(1);
  }
};

runScript();
