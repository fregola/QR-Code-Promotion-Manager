import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Snackbar,
  Grid,
} from '@mui/material';
import QrScanner from 'react-qr-scanner';
import axios from 'axios';

const QRCodeScanner = () => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [cameraStarted, setCameraStarted] = useState(false);
  const delay = 500; // Delay fisso per la scansione
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' per la fotocamera posteriore, 'user' per quella frontale

  // Funzione per gestire la scansione del QR code
  const handleQrCode = async (code) => {
    // Fermiamo la fotocamera per evitare scansioni multiple
    setCameraStarted(false);
    
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      console.log('Verifica del QR code:', code);
      const res = await axios.post('/api/qrcodes/verify', { code });
      
      // Verifichiamo che la risposta sia corretta e contiene i dati attesi
      if (res.data && res.data.success && res.data.data) {
        console.log('QR code valido:', res.data.data);
        setScanResult(res.data.data);
        setSuccess(`QR Code valido! Utilizzato ${res.data.data.qrCode.usageCount} volte.`);
        setSnackbarMessage('QR Code scansionato con successo!');
        setSnackbarOpen(true);
      } else {
        console.log('QR code non valido');
        setError('QR Code non valido o scaduto.');
      }
    } catch (err) {
      console.error('Error verifying QR code:', err);
      setError(err.response?.data?.message || 'Errore durante la verifica del QR code');
    } finally {
      setLoading(false);
    }
  };
  
  // Funzione per gestire l'errore della fotocamera
  const handleError = (err) => {
    console.error('Errore della fotocamera:', err);
    setError('Errore nell\'accesso alla fotocamera: ' + err.message);
    setCameraStarted(false);
  };
  
  // Funzione per gestire la scansione
  const handleScan = (data) => {
    if (data && data.text) {
      console.log('QR code scansionato:', data.text);
      handleQrCode(data.text);
    }
  };
  
  // Funzione per avviare la fotocamera
  const startCamera = () => {
    setError(null);
    setCameraStarted(true);
    console.log('Avvio della fotocamera...');
  };
  
  // Funzione per fermare la fotocamera
  const stopCamera = () => {
    setCameraStarted(false);
    console.log('Fotocamera fermata');
  };
  
  // Funzione per cambiare la fotocamera (frontale/posteriore)
  const toggleCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
    console.log('Cambio fotocamera a:', facingMode === 'environment' ? 'frontale' : 'posteriore');
  };

  useEffect(() => {
    console.log('Component mounted');
    
    // Cleanup function
    return () => {
      console.log('Component unmounting, cleaning up...');
      stopCamera();
    };
  }, []);

  // Funzioni per gestire gli input e gli eventi UI
  const handleManualChange = (e) => {
    setManualCode(e.target.value);
  };
  
  // Rinominato per corrispondere all'uso in Snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // handleManualSubmit è già definito sopra
  const handleManualSubmitWithEvent = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleQrCode(manualCode.trim());
    } else {
      setError('Inserisci un codice valido');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Scanner QR Code
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Scansiona un QR Code
            </Typography>
            <Box sx={{ width: '100%', mb: 3 }}>
              {cameraStarted && (
                <div style={{ width: '100%', marginBottom: '10px' }}>
                  <QrScanner
                    delay={delay}
                    style={{ width: '100%' }}
                    onError={handleError}
                    onScan={handleScan}
                    constraints={{
                      video: {
                        facingMode: facingMode
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={stopCamera}
                    >
                      Ferma Fotocamera
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={toggleCamera}
                    >
                      Cambia Fotocamera
                    </Button>
                  </Box>
                </div>
              )}
              {!cameraStarted && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={startCamera}
                  sx={{ mt: 2 }}
                >
                  Avvia Fotocamera
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Inserisci manualmente il codice QR
            </Typography>
            <Box component="form" onSubmit={handleManualSubmitWithEvent}>
              <TextField
                fullWidth
                label="Codice QR"
                variant="outlined"
                value={manualCode}
                onChange={handleManualChange}
                sx={{ mb: 2 }}
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !manualCode.trim()}
              >
                {loading ? <CircularProgress size={24} /> : 'Verifica'}
              </Button>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {scanResult && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Risultato Scansione
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle1">
                  Promozione: {scanResult.promotion.name}
                </Typography>

                {scanResult.promotion.description && (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {scanResult.promotion.description}
                  </Typography>
                )}

                <Typography variant="body2" sx={{ mt: 1 }}>
                  Codice QR: {scanResult.qrCode.code}
                </Typography>

                <Typography variant="body2">
                  Utilizzi: {scanResult.qrCode.usageCount}/{scanResult.qrCode.maxUsageCount}
                </Typography>
                
                {scanResult.qrCode.lastUsedAt && (
                  <Typography variant="body2">
                    Ultima attivazione: {new Date(scanResult.qrCode.lastUsedAt).toLocaleString('it-IT')}
                  </Typography>
                )}
                
                {scanResult.qrCode.createdAt && (
                  <Typography variant="body2">
                    Data creazione: {new Date(scanResult.qrCode.createdAt).toLocaleString('it-IT')}
                  </Typography>
                )}
                
                {scanResult.qrCode.usageCount > 0 && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Dettagli attivazioni:
                    </Typography>
                    <Typography variant="body2">
                      Questo QR code è stato attivato {scanResult.qrCode.usageCount} volte.
                      {scanResult.qrCode.usageCount >= scanResult.qrCode.maxUsageCount ? 
                        " Ha raggiunto il limite massimo di utilizzi." : 
                        ` Può essere utilizzato ancora ${scanResult.qrCode.maxUsageCount - scanResult.qrCode.usageCount} volte.`}
                    </Typography>
                  </Box>
                )}

                <Alert severity="success" sx={{ mt: 2 }}>
                  QR Code verificato con successo!
                </Alert>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={startCamera}
                  sx={{ mt: 2 }}
                  disabled={cameraStarted}
                >
                  Scansiona un altro QR Code
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default QRCodeScanner;