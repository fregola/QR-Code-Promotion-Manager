import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const EmailVerified = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');

  useEffect(() => {
    // Auto-redirect dopo 5 secondi
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
            <CheckCircleIcon 
              sx={{ fontSize: 80, color: 'success.main', mb: 2 }} 
            />
            
            <Typography variant="h4" gutterBottom color="success.main">
              Email Confermata!
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              🎉 Il tuo account è stato attivato con successo!
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Ora puoi accedere a tutte le funzionalità di QR Code Promotion Manager:
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" align="left">
                ✅ Creare promozioni illimitate<br/>
                ✅ Generare QR codes personalizzati<br/>
                ✅ Monitorare le statistiche<br/>
                ✅ Condividere le tue promozioni
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Verrai reindirizzato alla pagina di login tra pochi secondi...
            </Typography>

            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate('/login')}
              sx={{ mr: 2 }}
            >
              Accedi Ora
            </Button>

            <Button 
              variant="outlined" 
              size="large"
              onClick={() => navigate('/')}
            >
              Vai alla Home
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default EmailVerified;
