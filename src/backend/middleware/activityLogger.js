const ActivityLog = require('../models/ActivityLog');

// Utility per estrarre info dal request
const getClientInfo = (req) => {
  const userAgent = req.get('User-Agent') || '';
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Estrai info browser/device basiche
  const browser = getBrowserInfo(userAgent);
  const device = getDeviceInfo(userAgent);
  
  return {
    ip,
    userAgent,
    browser,
    device,
    referrer: req.get('Referer') || ''
  };
};

const getBrowserInfo = (userAgent) => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
};

const getDeviceInfo = (userAgent) => {
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop';
};

// Funzione principale per creare log
const createActivityLog = async (userId, action, details = {}, req = null) => {
  try {
    const logData = {
      user: userId,
      action: action,
      details: {
        ...details,
        metadata: {
          ...details.metadata,
          ...(req ? getClientInfo(req) : {})
        }
      },
      status: details.status || 'success',
      message: details.message || getDefaultMessage(action, details)
    };
    
    return await ActivityLog.createLog(logData);
  } catch (error) {
    console.error('Activity logging error:', error);
    return null;
  }
};

// Messaggi di default per le azioni
const getDefaultMessage = (action, details) => {
  const messages = {
    // Autenticazione
    'login': 'Utente connesso al sistema',
    'logout': 'Utente disconnesso dal sistema',
    'password_change': 'Password modificata',
    'profile_update': 'Profilo aggiornato',
    
    // Gestione Promozioni
    'promotion_create': `Nuova promozione creata: ${details.resourceName || 'N/A'}`,
    'promotion_update': `Promozione modificata: ${details.resourceName || 'N/A'}`,
    'promotion_delete': `Promozione eliminata: ${details.resourceName || 'N/A'}`,
    'promotion_activate': `Promozione attivata: ${details.resourceName || 'N/A'}`,
    'promotion_deactivate': `Promozione disattivata: ${details.resourceName || 'N/A'}`,
    
    // Gestione QR Codes
    'qrcode_create': `Nuovo QR Code generato: ${details.resourceName || 'N/A'}`,
    'qrcode_scan': `QR Code scansionato: ${details.resourceName || 'N/A'}`,
    'qrcode_download': `QR Code scaricato: ${details.resourceName || 'N/A'}`,
    'qrcode_view_stats': `Statistiche QR visualizzate: ${details.resourceName || 'N/A'}`,
    
    // Condivisioni
    'share_whatsapp': `QR condiviso su WhatsApp: ${details.resourceName || 'N/A'}`,
    'share_email': `QR condiviso via email: ${details.resourceName || 'N/A'}`,
    'share_facebook': `QR condiviso su Facebook: ${details.resourceName || 'N/A'}`,
    'share_twitter': `QR condiviso su Twitter: ${details.resourceName || 'N/A'}`,
    'share_linkedin': `QR condiviso su LinkedIn: ${details.resourceName || 'N/A'}`,
    'share_copy_link': `Link QR copiato: ${details.resourceName || 'N/A'}`,
    'share_direct_link': `QR condiviso tramite link diretto: ${details.resourceName || 'N/A'}`,
    
    // Amministrazione
    'admin_user_plan_change': `Piano utente modificato dall'admin`,
    'admin_user_password_reset': `Password resettata dall'admin`,
    'admin_user_status_change': `Status utente modificato dall'admin`,
    'admin_user_view': `Profilo utente visualizzato dall'admin`
  };
  
  return messages[action] || `Azione eseguita: ${action}`;
};

// Middleware per logging automatico del login
const logLogin = (req, res, next) => {
  // Intercetta la risposta per loggare solo login di successo
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode === 200) {
      // Estrai userId dalla risposta JWT se possibile
      try {
        const responseData = JSON.parse(data);
        if (responseData.success && responseData.token && req.body.email) {
          // Decodifica il token per ottenere l'userId (versione semplificata)
          // In un vero ambiente, usa una libreria JWT
          const base64Payload = responseData.token.split('.')[1];
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
          
          if (payload.id) {
            createActivityLog(payload.id, 'login', {
              message: `Login effettuato con email: ${req.body.email}`
            }, req);
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
    originalSend.call(this, data);
  };
  next();
};

// Middleware per logging delle route protette
const logProtectedRoute = (action, getDetails = () => ({})) => {
  return async (req, res, next) => {
    // Intercetta la risposta per loggare solo successi
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const details = typeof getDetails === 'function' ? getDetails(req, res, data) : getDetails;
        createActivityLog(req.user._id, action, details, req);
      }
      originalSend.call(this, data);
    };
    next();
  };
};

module.exports = {
  createActivityLog,
  logLogin,
  logProtectedRoute,
  getClientInfo
};