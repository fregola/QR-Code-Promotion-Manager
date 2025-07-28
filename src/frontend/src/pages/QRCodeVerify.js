import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
} from '@mui/material';
import axios from 'axios';

const QRCodeVerify = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [verifySuccess, setVerifySuccess] = useState(null);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const res = await axios.get(`/api/qrcodes/code/${code}`);
        setQrCodeData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Errore durante il recupero del QR code');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchQRCode();
    } else {
      setError('Codice QR non valido');
      setLoading(false);
    }
  }, [code]);

  const handleVerify = async () => {
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifySuccess(null);

    try {
      const res = await axios.post('/api/qrcodes/verify', { code });
      setVerifySuccess('QR Code verificato con successo!');
      // Update the QR code data with the latest information
      setQrCodeData(res.data.data);
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Errore durante la verifica del QR code');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
          Torna indietro
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Verifica QR Code
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dettagli QR Code
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle1">
              Codice: {qrCodeData.code}
            </Typography>

            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Promozione: {qrCodeData.promotion.name}
            </Typography>

            {qrCodeData.promotion.description && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {qrCodeData.promotion.description}
              </Typography>
            )}

            <Typography variant="body2" sx={{ mt: 1 }}>
              Stato: {qrCodeData.promotion.active ? 'Attiva' : 'Non attiva'}
            </Typography>

            <Typography variant="body2">
              Scadenza: {qrCodeData.promotion.expiryDate && new Date(qrCodeData.promotion.expiryDate).getFullYear() > 1970 
                ? new Date(qrCodeData.promotion.expiryDate).toLocaleDateString()
                : 'Nessuna scadenza'}
            </Typography>

            <Typography variant="body2">
              Utilizzi: {qrCodeData.usageCount}/{qrCodeData.maxUsageCount}
              {qrCodeData.maxUsageCount > 1 && qrCodeData.usageCount < qrCodeData.maxUsageCount && (
                <Box component="span" sx={{ ml: 1, color: 'success.main' }}>
                  (Ancora {qrCodeData.maxUsageCount - qrCodeData.usageCount} disponibili)
                </Box>
              )}
            </Typography>

            {qrCodeData.lastUsedAt && (
              <Typography variant="body2">
                Ultimo utilizzo: {new Date(qrCodeData.lastUsedAt).toLocaleString()}
              </Typography>
            )}
          </CardContent>
        </Card>
        
        {qrCodeData.business && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informazioni Azienda
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {qrCodeData.business.businessLogo && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box 
                    component="img"
                    src={qrCodeData.business.businessLogo}
                    alt="Logo aziendale"
                    sx={{ 
                      maxWidth: '100%', 
                      maxHeight: '150px',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
              )}
              
              <Typography variant="h5" gutterBottom>
                {qrCodeData.business.businessName || qrCodeData.business.name}
              </Typography>
              
              {qrCodeData.business.businessType && (
                <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                  {qrCodeData.business.businessType}
                </Typography>
              )}
              
              <Grid container spacing={2}>
                {(qrCodeData.business.address || qrCodeData.business.city || qrCodeData.business.postalCode) && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Indirizzo
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {[qrCodeData.business.address, qrCodeData.business.city, qrCodeData.business.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </Typography>
                  </Grid>
                )}
                
                {qrCodeData.business.phoneNumber && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Telefono
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <a href={`tel:${qrCodeData.business.phoneNumber}`} 
                         style={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
                        {qrCodeData.business.phoneNumber}
                      </a>
                    </Typography>
                  </Grid>
                )}
                
                {qrCodeData.business.website && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Sito Web
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <a href={qrCodeData.business.website.startsWith('http') ? qrCodeData.business.website : `https://${qrCodeData.business.website}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         style={{ color: 'inherit', textDecoration: 'underline' }}>
                        {qrCodeData.business.website}
                      </a>
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent>
            {verifyError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {verifyError}
              </Alert>
            )}

            {verifySuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {verifySuccess}
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleVerify}
                disabled={verifyLoading || qrCodeData.usageCount >= qrCodeData.maxUsageCount || !qrCodeData.promotion.active || new Date(qrCodeData.promotion.expiryDate) < new Date()}
              >
                {verifyLoading ? <CircularProgress size={24} /> : 'Verifica QR Code'}
              </Button>
              <Button variant="outlined" onClick={handleBack}>
                Torna indietro
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </>
  );
};

export default QRCodeVerify;