const dotenv = require('dotenv');
const connectDB = require('./src/backend/config/db');
const { migrateAllLogos } = require('./src/backend/utils/migrateLogo');

// Carica le variabili d'ambiente
dotenv.config();

// Funzione principale
const runMigration = async () => {
  try {
    console.log('Connessione al database...');
    await connectDB();
    
    console.log('Avvio migrazione loghi...');
    const result = await migrateAllLogos();
    
    console.log('\n=== RISULTATO MIGRAZIONE ===');
    console.log(`Loghi migrati con successo: ${result.migratedCount}`);
    console.log(`Errori durante la migrazione: ${result.errorCount}`);
    console.log('=============================\n');
    
    if (result.migratedCount > 0) {
      console.log('✅ Migrazione completata! I loghi sono ora salvati come file.');
      console.log('📁 I file sono stati salvati in: uploads/logos/');
      console.log('🔄 Il database è stato aggiornato con i nuovi percorsi.');
    } else {
      console.log('ℹ️  Nessun logo da migrare trovato.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  }
};

// Esegui la migrazione
runMigration();