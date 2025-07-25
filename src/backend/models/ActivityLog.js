const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  // Utente che ha eseguito l'azione
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tipo di attività
  activityType: {
    type: String,
    required: true,
    enum: [
      // Autenticazione
      'login',
      'logout',
      'register',
      'password_change',
      'password_reset',
      'profile_update',
      
      // Navigazione
      'page_view',
      'dashboard_access',
      'admin_panel_access',
      
      // Promozioni
      'promotion_create',
      'promotion_update',
      'promotion_delete',
      'promotion_view',
      'promotion_activate',
      'promotion_deactivate',
      
      // QR Codes
      'qrcode_create',
      'qrcode_generate',
      'qrcode_download',
      'qrcode_scan',
      'qrcode_delete',
      
      // Piani e limiti
      'plan_upgrade',
      'plan_downgrade',
      'limit_reached',
      
      // Amministrazione
      'admin_user_view',
      'admin_user_edit',
      'admin_stats_view',
      'admin_activity_view',
      
      // Errori/Sicurezza
      'login_failed',
      'unauthorized_access',
      'api_error',
      
      // Altro
      'file_upload',
      'export_data',
      'settings_change'
    ]
  },
  
  // Dettagli dell'attività
  description: {
    type: String,
    required: true
  },
  
  // Dati aggiuntivi specifici per ogni tipo di attività
  metadata: {
    // HTTP Info
    method: String,        // GET, POST, PUT, DELETE
    endpoint: String,      // /api/promotions, /api/qrcodes, etc.
    statusCode: Number,    // 200, 404, 500, etc.
    
    // Dati specifici dell'attività
    resourceId: String,    // ID della risorsa coinvolta (promotion, qrcode, etc.)
    resourceType: String,  // 'promotion', 'qrcode', 'user', etc.
    resourceName: String,  // Nome della risorsa per riferimento
    
    // Dati della richiesta
    userAgent: String,     // Browser/dispositivo
    ipAddress: String,     // IP dell'utente
    
    // Dati di business
    planType: String,      // Piano dell'utente al momento dell'azione
    monthlyUsage: {        // Uso mensile al momento dell'azione
      promotions: Number,
      qrCodes: Number
    },
    
    // Dati aggiuntivi variabili (per flessibilità)
    customData: mongoose.Schema.Types.Mixed
  },
  
  // Informazioni tecniche
  sessionId: String,       // ID della sessione (se disponibile)
  
  // Geolocalizzazione (opzionale)
  location: {
    country: String,
    city: String,
    region: String
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Durata della richiesta (in millisecondi)
  duration: Number,
  
  // Successo/Errore
  success: {
    type: Boolean,
    default: true
  },
  
  // Messaggio di errore (se success = false)
  errorMessage: String,
  
  // Priorità del log (per filtrare eventi importanti)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true,  // Aggiunge automaticamente createdAt e updatedAt
  collection: 'activity_logs'
});

// INDICI per performance delle query
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ activityType: 1, timestamp: -1 });
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ 'metadata.endpoint': 1 });
ActivityLogSchema.index({ success: 1, priority: 1 });

// METODI STATICI per creare log facilmente
ActivityLogSchema.statics.logActivity = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error saving activity log:', error);
    // Non interrompere l'applicazione se il logging fallisce
  }
};

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);