import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';

const CookiePolicy = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Cookie Policy
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
        </Typography>
        
        <Divider sx={{ mb: 4 }} />

        <Box sx={{ '& > *': { mb: 3 } }}>
          <Typography variant="h5" component="h2">
            1. Cosa sono i Cookie
          </Typography>
          <Typography variant="body1">
            I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti il nostro sito web. 
            Ci aiutano a fornire una migliore esperienza utente e a comprendere come utilizzi il nostro servizio.
          </Typography>

          <Typography variant="h5" component="h2">
            2. Tipi di Cookie che Utilizziamo
          </Typography>
          <Typography variant="body1">
            <strong>Cookie Essenziali:</strong> Necessari per il funzionamento del sito e per la sicurezza.<br/>
            <strong>Cookie di Performance:</strong> Ci aiutano a capire come i visitatori interagiscono con il sito.<br/>
            <strong>Cookie di Funzionalità:</strong> Memorizzano le tue preferenze per personalizzare l'esperienza.<br/>
            <strong>Cookie di Marketing:</strong> Utilizzati per mostrare contenuti rilevanti (solo con consenso).
          </Typography>

          <Typography variant="h5" component="h2">
            3. Cookie di Terze Parti
          </Typography>
          <Typography variant="body1">
            Potremmo utilizzare servizi di terze parti che impostano i propri cookie per funzionalità come 
            analytics, mappe o social media. Questi cookie sono soggetti alle rispettive privacy policy.
          </Typography>

          <Typography variant="h5" component="h2">
            4. Come Gestire i Cookie
          </Typography>
          <Typography variant="body1">
            Puoi controllare e/o eliminare i cookie come preferisci attraverso le impostazioni del tuo browser. 
            Tuttavia, la rimozione di alcuni cookie potrebbe influenzare la funzionalità del sito.
          </Typography>

          <Typography variant="h5" component="h2">
            5. Consenso
          </Typography>
          <Typography variant="body1">
            Utilizzando il nostro sito web e accettando questa Cookie Policy, acconsenti all'uso dei cookie 
            in conformità con i termini descritti in questa policy.
          </Typography>

          <Typography variant="h5" component="h2">
            6. Aggiornamenti
          </Typography>
          <Typography variant="body1">
            Potremmo aggiornare questa Cookie Policy periodicamente. Ti informeremo di eventuali modifiche 
            significative attraverso il nostro sito web.
          </Typography>

          <Typography variant="h5" component="h2">
            7. Contatti
          </Typography>
          <Typography variant="body1">
            Per domande sui cookie, contattaci all'indirizzo: privacy@qrcodepromotion.it
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CookiePolicy;
