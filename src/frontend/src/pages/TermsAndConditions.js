import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';

const TermsAndConditions = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Termini e Condizioni
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
        </Typography>
        
        <Divider sx={{ mb: 4 }} />

        <Box sx={{ '& > *': { mb: 3 } }}>
          <Typography variant="h5" component="h2">
            1. Accettazione dei Termini
          </Typography>
          <Typography variant="body1">
            Utilizzando il servizio QR Code Promotion Manager, accetti di essere vincolato da questi termini e condizioni. 
            Se non accetti questi termini, non utilizzare il servizio.
          </Typography>

          <Typography variant="h5" component="h2">
            2. Descrizione del Servizio
          </Typography>
          <Typography variant="body1">
            QR Code Promotion Manager è una piattaforma per la creazione e gestione di codici QR per promozioni commerciali. 
            Il servizio consente agli utenti registrati di generare codici QR personalizzati per le proprie attività commerciali.
          </Typography>

          <Typography variant="h5" component="h2">
            3. Registrazione e Account
          </Typography>
          <Typography variant="body1">
            Per utilizzare il servizio, devi creare un account fornendo informazioni accurate e complete. 
            Sei responsabile della sicurezza del tuo account e delle attività che si verificano sotto il tuo account.
          </Typography>

          <Typography variant="h5" component="h2">
            4. Utilizzo Accettabile
          </Typography>
          <Typography variant="body1">
            Ti impegni a utilizzare il servizio solo per scopi legali e in conformità con tutte le leggi e regolamenti applicabili. 
            È vietato utilizzare il servizio per attività illegali, fraudolente o che violino i diritti di terzi.
          </Typography>

          <Typography variant="h5" component="h2">
            5. Proprietà Intellettuale
          </Typography>
          <Typography variant="body1">
            Tutti i contenuti del servizio, inclusi ma non limitati a testi, grafici, loghi e software, 
            sono di proprietà di QR Code Promotion Manager o dei suoi licenzianti e sono protetti da copyright e altre leggi sulla proprietà intellettuale.
          </Typography>

          <Typography variant="h5" component="h2">
            6. Privacy
          </Typography>
          <Typography variant="body1">
            La raccolta e l'utilizzo delle informazioni personali sono disciplinati dalla nostra Privacy Policy, 
            che fa parte integrante di questi termini.
          </Typography>

          <Typography variant="h5" component="h2">
            7. Limitazione di Responsabilità
          </Typography>
          <Typography variant="body1">
            Il servizio è fornito "così com'è" senza garanzie di alcun tipo. Non saremo responsabili per danni diretti, 
            indiretti, incidentali o consequenziali derivanti dall'uso del servizio.
          </Typography>

          <Typography variant="h5" component="h2">
            8. Modifiche ai Termini
          </Typography>
          <Typography variant="body1">
            Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. 
            Le modifiche entreranno in vigore immediatamente dopo la pubblicazione sul sito.
          </Typography>

          <Typography variant="h5" component="h2">
            9. Contatti
          </Typography>
          <Typography variant="body1">
            Per domande riguardo questi termini, contattaci all'indirizzo: info@qrcodepromotion.it
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsAndConditions;
