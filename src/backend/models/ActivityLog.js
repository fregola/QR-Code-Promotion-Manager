const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  // Utente che ha eseguito l'azione
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tipo di azione
  action: {
    type: String,
    required: true,
    enum: [
      // Autenticazione
      'login', 'logout', 'password_change', 'profile_update',
      
      // Gestione Promozioni
      'promotion_create', 'promotion_update', 'promotion_delete', 
      'promotion_activate', 'promotion_deactivate',
      
      // Gestione QR Codes
      'qrcode_create', 'qrcode_scan', 'qrcode_download', 'qrcode_view_stats',
      
      // Condivisioni
      'share_whatsapp', 'share_email', 'share_facebook', 'share_twitter', 
      'share_linkedin', 'share_copy_link', 'share_direct_link',
      
      // Amministrazione (per admin)
      'admin_user_plan_change', 'admin_user_password_reset', 
      'admin_user_status_change', 'admin_user_view'
    ]
  },
  
  // Dettagli dell'azione
  details: {
    // ID della risorsa coinvolta (promozione, QR, ecc.)
    resourceId: mongoose.Schema.Types.ObjectId,
    resourceType: {
      type: String,
      enum: ['promotion', 'qrcode', 'user']
    },
    
    // Nome/descrizione della risorsa
    resourceName: String,
    
    // Dati aggiuntivi specifici dell'azione
    metadata: {
      // Per login: IP, user agent, dispositivo
      ip: String,
      userAgent: String,
      device: String,
      browser: String,
      
      // Per condivisioni: piattaforma, metodo
      platform: String,
      method: String,
      
      // Per modifiche: valori precedenti e nuovi
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      
      // Per scansioni QR: posizione, referrer
      location: String,
      referrer: String,
      
      // Eventuali note aggiuntive
      notes: String
    }
  },
  
  // Timestamp dell'azione
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Status dell'azione (successo, fallimento, ecc.)
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  
  // Messaggio descrittivo dell'azione
  message: String

}, {
  timestamps: true,
  // Indici per performance
  index: [
    { user: 1, timestamp: -1 },
    { action: 1, timestamp: -1 },
    { 'details.resourceType': 1, 'details.resourceId': 1 }
  ]
});

// Metodo statico per creare un log
ActivityLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Non bloccare l'applicazione se il logging fallisce
    return null;
  }
};

// Metodo per ottenere i log di un utente
ActivityLogSchema.statics.getUserLogs = async function(userId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    action = null,
    dateFrom = null,
    dateTo = null
  } = options;
  
  const query = { user: userId };
  
  if (action) {
    query.action = action;
  }
  
  if (dateFrom || dateTo) {
    query.timestamp = {};
    if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
    if (dateTo) query.timestamp.$lte = new Date(dateTo);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'name email')
    .lean();
};

// Metodo per statistiche attività utente
ActivityLogSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastAction: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);