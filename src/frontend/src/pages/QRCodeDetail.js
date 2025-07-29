import React, { useState, useEffect, useCallback } from 'react';
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
  CardMedia,
  Divider,
  Grid,
  Chip,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import axios from 'axios';
import ShareDialog from '../components/ShareDialog';

const QRCodeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const res = await axios.get(`/api/qrcodes/${id}`);
        setQrCode(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Errore durante il recupero del QR code');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQRCode();
    } else {
      setError('ID QR code non valido');
      setLoading(false);
    }
  }, [id]);

  // La cronologia delle condivisioni viene ora caricata direttamente dal database nel componente ShareDialog

  const handleBack = () => {
    navigate(-1);
  };

  // Funzione rimossa perché non più necessaria dopo la rimozione della sezione "Promozione associata"

  const handleShareLink = () => {
    setShareDialogOpen(true);
  };
  
  const handleShareDialogClose = () => {
    setShareDialogOpen(false);
    // La cronologia viene aggiornata automaticamente nel componente ShareDialog
  };



  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDownload = () => {
    if (qrCode?.qrImagePath) {
      // Fetch the image as a blob
      fetch(qrCode.qrImagePath)
        .then(response => response.blob())
        .then(blob => {
          // Create a blob URL
          const blobUrl = URL.createObjectURL(blob);
          
          // Create a temporary anchor element
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `qrcode-${qrCode.code}.png`;
          
          // Append to body, click and remove
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Release the blob URL
          URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
          console.error('Errore durante il download del QR code:', error);
          alert('Si è verificato un errore durante il download del QR code. Riprova più tardi.');
        });
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dettagli QR Code
        </Typography>
        <Button variant="outlined" onClick={handleBack}>
          Torna indietro
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              image={qrCode.qrImagePath}
              alt={`QR Code ${qrCode.code}`}
              sx={{ padding: 2, objectFit: 'contain', height: 250 }}
            />
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {qrCode.code}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleDownload}
                sx={{ mt: 1 }}
              >
                Scarica QR Code
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informazioni QR Code
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Codice
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {qrCode.code}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Stato
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {qrCode.usageCount >= qrCode.maxUsageCount ? (
                    <Chip
                      icon={<CancelIcon />}
                      label="Esaurito"
                      color="error"
                      size="small"
                    />
                  ) : (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Disponibile"
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Utilizzi
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {qrCode.usageCount} / {qrCode.maxUsageCount}
                  {qrCode.shares && qrCode.shares.length > 0 && (
                    <Chip
                      icon={<ShareIcon fontSize="small" />}
                      label="Condiviso"
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Creato il
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body1" gutterBottom>
                    {new Date(qrCode.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>

              {qrCode.lastUsed && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Ultimo utilizzo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      {new Date(qrCode.lastUsed).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              )}
              
              {qrCode.promotion?.expiryDate && new Date(qrCode.promotion.expiryDate).getFullYear() > 1970 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Scadenza
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      {new Date(qrCode.promotion.expiryDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Cronologia delle condivisioni */}
            {qrCode.shares && qrCode.shares.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Cronologia condivisioni
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Paper sx={{ maxHeight: 200, overflow: 'auto', mb: 3 }}>
                  <List dense>
                    {qrCode.shares.map((share, index) => {
                      // Mappa per convertire i valori del backend in nomi visualizzabili
                      const platformDisplayMap = {
                        'whatsapp': 'WhatsApp',
                        'sms': 'SMS',
                        'telegram': 'Telegram',
                        'email': 'Email',
                        'facebook': 'Facebook',
                        'twitter': 'Twitter',
                        'link': 'Copia Link'
                      };
                      
                      const displayPlatform = platformDisplayMap[share.platform] || share.platform;
                      
                      return (
                        <ListItem key={share._id || index}>
                          <ListItemIcon>
                            <Chip
                              label={displayPlatform}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={share.message || `Condiviso su ${displayPlatform}`}
                            secondary={
                              <Typography variant="caption" display="block">
                                {new Date(share.sharedAt).toLocaleString('it-IT')}
                              </Typography>
                            }
                            primaryTypographyProps={{
                              variant: 'body2',
                              sx: {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }
                            }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              </>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate(`/qrcode/verify/${qrCode.code}`)}
              >
                Verifica QR Code
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ShareIcon />}
                onClick={handleShareLink}
              >
                Condividi QR Code
              </Button>
            </Box>
          </Paper>
        </Grid>

      </Grid>
     <ShareDialog
          open={shareDialogOpen}
          onClose={handleShareDialogClose}
          qrCode={qrCode}
          title="Condividi QR Code"
        />
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'primary.main',
            color: 'white',
            fontSize: '1rem',
            padding: '10px 16px',
            minWidth: '300px',
            display: 'flex',
            justifyContent: 'center'
          }
        }}
      />
    </>
  );
};

export default QRCodeDetail;