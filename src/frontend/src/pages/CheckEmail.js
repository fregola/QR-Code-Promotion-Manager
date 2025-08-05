import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Button,
  Alert
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import WarningIcon from '@mui/icons-material/Warning';

const CheckEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Card sx={{ width: '100%', textAlign: 'center', p: 3 }}>
          <CardContent>
            <EmailIcon 
              sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} 
            />
            
            <Typography variant="h4" gutterBottom color="primary.main">
              📧 Controlla la tua email!
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Ti abbiamo inviato un link di conferma
            </Typography>
            
            {email && (
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                📨 Email inviata a: <strong>{email}</strong>
              </Typography>
            )}
            
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Per completare la registrazione:</strong><br/>
                1. 📬 Controlla la tua casella di posta<br/>
                2. 📁 <strong>Controlla anche nella cartella SPAM/Posta indesiderata</strong><br/>
                3. 🔗 Clicca sul link "Conferma il mio account"<br/>
                4. ✅ Il tuo account sarà attivato immediatamente
              </Typography>
            </Alert>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <WarningIcon sx={{ mr: 1 }} />
              <strong>IMPORTANTE:</strong> Non puoi accedere finché non confermi la tua email!
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Non hai ricevuto l'email? Può richiedere alcuni minuti.<br/>
              Il link è valido per 24 ore.
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/login')}
                sx={{ mr: 2 }}
              >
                Vai al Login
              </Button>
              
              <Button 
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Torna alla Home
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Hai problemi? Controlla che l'email non sia finita nello SPAM
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default CheckEmail;
