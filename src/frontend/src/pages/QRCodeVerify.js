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
      setVerifySuccess('QR Code attivato con successo!');
      // Update the QR code data with the latest information
      setQrCodeData(res.data.data);
    } catch (err) {
      setVerifyError(err.response?.data?.error || 'Errore durante l\'attivazione del QR code');
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
        Attivazione QR Code
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
                disabled={verifyLoading}
              >
                {verifyLoading ? <CircularProgress size={24} /> : 'Attiva QR Code'}
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