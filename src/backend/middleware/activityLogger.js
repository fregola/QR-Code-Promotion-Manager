const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// Configurazione delle attività da tracciare
const ACTIVITY_CONFIG = {
  // Endpoints da tracciare automaticamente
  trackEndpoints: {
    // Autenticazione
    'POST /api/auth/login': 'login',
    'GET /api/auth/logout': 'logout',
    'POST /api/auth/register': 'register',
    'PUT /api/auth/updatepassword': 'password_change',
    'PUT /api/auth/updateprofile': 'profile_update',
    'POST /api/auth/forgotpassword': 'password_reset',
    
    // Dashboard e navigazione
    'GET /api/auth/me': 'dashboard_access',
    
    // Promozioni
    'POST /api/promotions': 'promotion_create',
    'PUT /api/promotions': 'promotion_update',
    'DELETE /api/promotions': 'promotion_delete',
    'GET /api/promotions': 'promotion_view',
    
    // QR Codes
    'POST /api/qrcodes': 'qrcode_create',
    'DELETE /api/qrcodes': 'qrcode_delete',
    'GET /api/qrcodes/download': 'qrcode_download',
    'POST /api/qrcodes/generate': 'qrcode_generate',
    'PUT /api/qrcodes/scan': 'qrcode_scan',
    
    // Admin
    'GET /api/admin/users': 'admin_user_view',
    'PUT /api/admin/users': 'admin_user_edit',
    'GET /api/admin/stats': 'admin_stats_view',
    'GET /api/admin/activity': 'admin_activity_view',
    
    // Piani
    'GET /api/plans/info': 'page_view'
  },
  
  // Endpoints da non tracciare (per evitare spam nei log)
  ignoreEndpoints: [
    '/api/auth/me',  // Troppo frequente, logghiamo solo al primo accesso della sessione
    '/favicon.ico',
    '/api/health',
    '/api/ping'
  ],
  
  // Metodi HTTP da tracciare
  trackMethods: ['POST', 'PUT', 'DELETE', 'GET'],
  
  // Headers sensibili da non salvare
  sensitiveHeaders: ['authorization', 'cookie', 'x-api-key']
};

// Middleware principale per il logging delle attività
const activityLogger = () => {
  return async (req, res, next) => {
    // Salta se l'endpoint è nella lista ignore
    if (shouldIgnoreEndpoint(req)) {
      return next();
    }

    const startTime = Date.now();
    
    // Intercetta la risposta per ottenere il codice di stato
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseData = null;
    
    res.send = function(data) {
      responseData = data;
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };
    
    // Continua con la richiesta
    next();
    
    // Logga l'attività dopo che la risposta è stata inviata
    res.on('finish', async () => {
      try {
        await logActivity(req, res, responseData, startTime);
      } catch (error) {
        console.error('Activity logging error:', error);
        // Non interrompere l'applicazione se il logging fallisce
      }
    });
  };
};

// Funzione per determinare se l'endpoint deve essere ignorato
function shouldIgnoreEndpoint(req) {
  const path = req.originalUrl || req.url;
  
  // Ignora file statici
  if (path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    return true;
  }
  
  // Ignora endpoint specifici
  return ACTIVITY_CONFIG.ignoreEndpoints.some(ignored => 
    path.startsWith(ignored)
  );
}

// Funzione principale per loggare l'attività
async function logActivity(req, res, responseData, startTime) {
  // Solo per utenti autenticati
  if (!req.user || !req.user.id) {
    return;
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const endpoint = req.originalUrl || req.url;
  const method = req.method;
  const statusCode = res.statusCode;
  const success = statusCode >= 200 && statusCode < 400;
  
  // Determina il tipo di attività
  const activityType = getActivityType(method, endpoint, req.body, responseData);
  if (!activityType) {
    return; // Non tracciare se non riusciamo a determinare il tipo
  }
  
  // Ottieni informazioni aggiornate dell'utente per i metadati
  let userData = null;
  try {
    userData = await User.findById(req.user.id).select('planType monthlyPromotionsCount monthlyQrCodesCount');
  } catch (error) {
    console.error('Error fetching user data for logging:', error);
  }
  
  // Genera la descrizione dell'attività
  const description = generateDescription(activityType, method, endpoint, req.body, responseData, success);
  
  // Estrai metadati della risorsa (se applicabile)
  const resourceMetadata = extractResourceMetadata(activityType, req.body, responseData);
  
  // Crea il log dell'attività
  const logData = {
    userId: req.user.id,
    activityType,
    description,
    metadata: {
      method,
      endpoint,
      statusCode,
      userAgent: req.get('User-Agent'),
      ipAddress: getClientIP(req),
      planType: userData?.planType || 'unknown',
      monthlyUsage: {
        promotions: userData?.monthlyPromotionsCount || 0,
        qrCodes: userData?.monthlyQrCodesCount || 0
      },
      ...resourceMetadata
    },
    duration,
    success,
    errorMessage: success ? null : extractErrorMessage(responseData),
    priority: getPriority(activityType, success)
  };
  
  // Salva il log
  await ActivityLog.logActivity(logData);
}

// Determina il tipo di attività basato su endpoint e metodo
function getActivityType(method, endpoint, body, responseData) {
  const key = `${method} ${endpoint.split('?')[0]}`;
  
  // Controlla configurazione esplicita
  if (ACTIVITY_CONFIG.trackEndpoints[key]) {
    return ACTIVITY_CONFIG.trackEndpoints[key];
  }
  
  // Logica dinamica per endpoint parametrici
  if (endpoint.includes('/api/promotions/')) {
    if (method === 'GET') return 'promotion_view';
    if (method === 'PUT') return 'promotion_update';
    if (method === 'DELETE') return 'promotion_delete';
  }
  
  if (endpoint.includes('/api/qrcodes/')) {
    if (method === 'GET') return 'qrcode_view';
    if (method === 'PUT') return 'qrcode_update';
    if (method === 'DELETE') return 'qrcode_delete';
  }
  
  if (endpoint.includes('/api/admin/')) {
    return 'admin_panel_access';
  }
  
  // Default per navigazione generale
  if (method === 'GET') {
    return 'page_view';
  }
  
  return null;
}

// Genera descrizione umana dell'attività
function generateDescription(activityType, method, endpoint, body, responseData, success) {
  const descriptions = {
    'login': 'Utente ha effettuato il login',
    'logout': 'Utente ha effettuato il logout',
    'register': 'Nuovo utente registrato',
    'password_change': 'Utente ha cambiato la password',
    'password_reset': 'Utente ha richiesto il reset della password',
    'profile_update': 'Utente ha aggiornato il profilo',
    'dashboard_access': 'Utente ha acceduto alla dashboard',
    'promotion_create': `Utente ha creato una nuova promozione: ${body?.name || 'Nome non disponibile'}`,
    'promotion_update': `Utente ha modificato la promozione: ${body?.name || extractNameFromResponse(responseData)}`,
    'promotion_delete': 'Utente ha eliminato uma promozione',
    'promotion_view': 'Utente ha visualizzato le promozioni',
    'qrcode_create': 'Utente ha generato nuovi QR Code',
    'qrcode_download': 'Utente ha scaricato QR Code',
    'qrcode_scan': 'QR Code è stato scansionato',
    'qrcode_delete': 'Utente ha eliminato QR Code',
    'admin_user_view': 'Admin ha visualizzato la lista utenti',
    'admin_user_edit': 'Admin ha modificato un utente',
    'admin_stats_view': 'Admin ha visualizzato le statistiche',
    'admin_activity_view': 'Admin ha visualizzato i log delle attività',
    'admin_panel_access': 'Utente ha acceduto al pannello admin',
    'page_view': `Utente ha visitato: ${endpoint}`
  };
  
  let description = descriptions[activityType] || `Azione: ${activityType} su ${endpoint}`;
  
  if (!success) {
    description += ' (FALLITA)';
  }
  
  return description;
}

// Estrae metadati della risorsa dalle richieste/risposte
function extractResourceMetadata(activityType, body, responseData) {
  const metadata = {};
  
  // Per promozioni
  if (activityType.includes('promotion')) {
    if (body?.name) metadata.resourceName = body.name;
    if (body?.id || body?._id) metadata.resourceId = body.id || body._id;
    metadata.resourceType = 'promotion';
  }
  
  // Per QR codes
  if (activityType.includes('qrcode')) {
    if (body?.promotionId) metadata.resourceId = body.promotionId;
    if (body?.qrCodesCount) metadata.customData = { quantity: body.qrCodesCount };
    metadata.resourceType = 'qrcode';
  }
  
  return metadata;
}

// Estrae messaggi di errore dalle risposte
function extractErrorMessage(responseData) {
  if (typeof responseData === 'string') {
    try {
      const parsed = JSON.parse(responseData);
      return parsed.error || parsed.message || 'Errore sconosciuto';
    } catch {
      return responseData.substring(0, 200); // Limita la lunghezza
    }
  }
  
  if (typeof responseData === 'object' && responseData) {
    return responseData.error || responseData.message || 'Errore sconosciuto';
  }
  
  return 'Errore sconosciuto';
}

// Determina la priorità del log
function getPriority(activityType, success) {
  if (!success) return 'high';
  
  const highPriorityActivities = ['login', 'register', 'promotion_create', 'promotion_delete', 'qrcode_create'];
  const lowPriorityActivities = ['page_view', 'dashboard_access'];
  
  if (highPriorityActivities.includes(activityType)) return 'high';
  if (lowPriorityActivities.includes(activityType)) return 'low';
  
  return 'medium';
}

// Ottiene l'IP del client considerando proxy
function getClientIP(req) {
  return req.ip || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    'unknown';
}

// Funzioni helper
function extractNameFromResponse(responseData) {
  if (typeof responseData === 'object' && responseData?.data?.name) {
    return responseData.data.name;
  }
  return 'Nome non disponibile';
}

module.exports = {
  activityLogger
};