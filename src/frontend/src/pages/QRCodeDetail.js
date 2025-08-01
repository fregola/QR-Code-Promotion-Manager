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
  Person as PersonIcon,
  History,
  Share as ShareIcon
} from '@mui/icons-material';
import axios from 'axios';
import ShareDialog from '../components/ShareDialog';
import ShareHistory from '../components/ShareHistory';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
        
        // Recupera le informazioni di condivisione
        await fetchShareInfo(res.data.data);
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
  
  const fetchShareInfo = async (qrCodeData) => {
    try {
      const token = localStorage.getItem('token');
      const shareRes = await axios.get(`${API_BASE_URL}/api/qrcodes/${qrCodeData._id}/shares`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setQrCode({
        ...qrCodeData,
        isShared: shareRes.data.data.totalShares > 0,
        shares: shareRes.data.data.shares,
        totalShares: shareRes.data.data.totalShares
      });
    } catch (error) {
      console.error('Errore nel recupero delle condivisioni:', error);
    }
  };



  const handleBack = () => {
    navigate(-1);
  };

  const handlePromotionClick = () => {
    if (qrCode?.promotion?._id) {
      navigate(`/promotions/${qrCode.promotion._id}`);
    }
  };
  
  const handleShareClick = () => {
    setShareDialogOpen(true);
  };
  
  const handleShareComplete = () => {
    // Aggiorna le informazioni di condivisione dopo una nuova condivisione
    fetchShareInfo(qrCode);
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
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Promozione associata
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Card sx={{ mb: 2, cursor: 'pointer' }} onClick={handlePromotionClick}>
              <CardContent>
                <Typography variant="h6">{qrCode.promotion.name}</Typography>
                {qrCode.promotion.description && (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {qrCode.promotion.description}
                  </Typography>
                )}
                


                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Stato
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {qrCode.promotion.active ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Attiva"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<CancelIcon />}
                          label="Da utilizzare"
                          color="error"
                          size="small"
                        />
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Scadenza
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        {qrCode.promotion.expiryDate && new Date(qrCode.promotion.expiryDate).getFullYear() > 1970 
                          ? new Date(qrCode.promotion.expiryDate).toLocaleDateString()
                          : 'Nessuna scadenza'}
                      </Typography>
                    </Box>
                  </Grid>


                </Grid>
              </CardContent>
            </Card>



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
                color="primary"
                startIcon={<ShareIcon />}
                onClick={handleShareClick}
              >
                Condividi
              </Button>
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Cronologia condivisioni
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 3 }}>
              <ShareHistory qrCode={qrCode} />
            </Box>
          </Paper>
        </Grid>

      </Grid>
      
      {/* Share Dialog */}
      {qrCode && (
        <ShareDialog 
          open={shareDialogOpen} 
          onClose={() => setShareDialogOpen(false)} 
          qrCode={qrCode}
          onShareComplete={handleShareComplete}
        />
      )}
      
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