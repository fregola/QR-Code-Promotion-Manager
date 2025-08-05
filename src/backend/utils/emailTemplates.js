const getVerificationEmailTemplate = (name, verificationUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Conferma il tuo account</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 QR Code Promotion Manager</h1>
            </div>
            <div class="content">
                <h2>Ciao ${name}!</h2>
                <p>Grazie per esserti registrato su <strong>QR Code Promotion Manager</strong>!</p>
                <p>Per completare la registrazione e attivare il tuo account, clicca sul pulsante qui sotto:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">
                        ✅ Conferma il mio account
                    </a>
                </div>
                
                <p>Oppure copia e incolla questo link nel tuo browser:</p>
                <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">
                    ${verificationUrl}
                </p>
                
                <p><strong>⏰ Questo link scadrà tra 24 ore.</strong></p>
                
                <p>Se non hai creato un account, puoi ignorare questa email.</p>
            </div>
            <div class="footer">
                <p>© 2025 QR Code Promotion Manager - Tutti i diritti riservati</p>
                <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const getWelcomeEmailTemplate = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Benvenuto!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Benvenuto!</h1>
            </div>
            <div class="content">
                <h2>Ciao ${name}!</h2>
                <p><strong>Il tuo account è stato confermato con successo!</strong></p>
                <p>Ora puoi accedere a tutte le funzionalità di QR Code Promotion Manager:</p>
                
                <ul>
                    <li>✅ Creare promozioni illimitate</li>
                    <li>✅ Generare QR codes personalizzati</li>
                    <li>✅ Monitorare le statistiche</li>
                    <li>✅ Condividere le tue promozioni</li>
                </ul>
                
                <div style="text-align: center;">
                    <a href="${process.env.CLIENT_URL || 'http://84.247.137.249'}" class="button">
                        🚀 Inizia ora
                    </a>
                </div>
                
                <p>Se hai domande o hai bisogno di aiuto, non esitare a contattarci!</p>
            </div>
            <div class="footer">
                <p>© 2025 QR Code Promotion Manager - Tutti i diritti riservati</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = {
  getVerificationEmailTemplate,
  getWelcomeEmailTemplate
};
