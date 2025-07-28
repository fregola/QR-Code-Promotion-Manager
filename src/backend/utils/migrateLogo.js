const fs = require('fs');
const path = require('path');
const User = require('../models/User');

// Funzione per convertire base64 in file
const convertBase64ToFile = (base64String, userId) => {
  try {
    // Verifica se è una stringa base64 valida
    if (!base64String || !base64String.startsWith('data:image/')) {
      return null;
    }

    // Estrai il tipo di file e i dati
    const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return null;
    }

    const fileExtension = matches[1];
    const base64Data = matches[2];
    
    // Crea il nome del file
    const fileName = `logo-${userId}-${Date.now()}.${fileExtension}`;
    const logoDir = path.join(__dirname, '../../../uploads/logos');
    const filePath = path.join(logoDir, fileName);
    
    // Assicurati che la directory esista
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }
    
    // Scrivi il file
    fs.writeFileSync(filePath, base64Data, 'base64');
    
    // Ritorna il percorso relativo
    return `/uploads/logos/${fileName}`;
  } catch (error) {
    console.error('Errore nella conversione base64:', error);
    return null;
  }
};

// Funzione per migrare tutti i loghi
const migrateAllLogos = async () => {
  try {
    console.log('Inizio migrazione loghi da base64 a file...');
    
    // Trova tutti gli utenti con businessLogo che inizia con 'data:image/'
    const users = await User.find({
      businessLogo: { $regex: /^data:image\// }
    });
    
    console.log(`Trovati ${users.length} utenti con loghi base64 da migrare`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        const filePath = convertBase64ToFile(user.businessLogo, user._id);
        
        if (filePath) {
          // Aggiorna l'utente con il nuovo percorso
          await User.findByIdAndUpdate(user._id, {
            businessLogo: filePath
          });
          
          migratedCount++;
          console.log(`Migrato logo per utente ${user._id}: ${filePath}`);
        } else {
          errorCount++;
          console.error(`Errore nella migrazione del logo per utente ${user._id}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Errore nella migrazione del logo per utente ${user._id}:`, error);
      }
    }
    
    console.log(`Migrazione completata: ${migratedCount} successi, ${errorCount} errori`);
    return { migratedCount, errorCount };
  } catch (error) {
    console.error('Errore durante la migrazione:', error);
    throw error;
  }
};

module.exports = {
  convertBase64ToFile,
  migrateAllLogos
};