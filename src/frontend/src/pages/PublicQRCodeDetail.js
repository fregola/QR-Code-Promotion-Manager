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
  Chip,
} from '@mui/material';
import axios from 'axios';

// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const PublicQRCodeDetail = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 500 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => window.location.href = '/'}>
          Torna alla home
        </Button>
      </Box>
    );
  }

  // Verifica se la data di scadenza è valida (non è 1970-01-01 o null/undefined)
  const hasValidExpiryDate = qrCodeData.promotion.expiryDate && 
    new Date(qrCodeData.promotion.expiryDate).getFullYear() > 1970;
  const isExpired = hasValidExpiryDate && new Date(qrCodeData.promotion.expiryDate) < new Date();
  const isUsedUp = qrCodeData.usageCount >= qrCodeData.maxUsageCount;
  const isActive = qrCodeData.promotion.isActive && (!hasValidExpiryDate || !isExpired) && !isUsedUp;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      p: 3, 
      minHeight: '100vh',
      bgcolor: '#f5f5f5'
    }}>
      <Paper sx={{ p: 3, mb: 3, width: '100%', maxWidth: 600 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Dettagli QR Code
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informazioni QR Code
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Codice
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {qrCodeData.code}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Stato
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {isActive ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Disponibile"
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Chip
                      icon={<CancelIcon />}
                      label={isUsedUp ? "Esaurito" : isExpired ? "Scaduto" : "Non attivo"}
                      color="error"
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
                  {qrCodeData.usageCount}/{qrCodeData.maxUsageCount}
                  {qrCodeData.maxUsageCount > 1 && qrCodeData.usageCount < qrCodeData.maxUsageCount && (
                    <Box component="span" sx={{ ml: 1, color: 'success.main' }}>
                      (Ancora {qrCodeData.maxUsageCount - qrCodeData.usageCount} disponibili)
                    </Box>
                  )}
                </Typography>
              </Grid>
              
              {qrCodeData.lastUsedAt && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Ultimo utilizzo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body1" gutterBottom>
                      {new Date(qrCodeData.lastUsedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Promozione
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="h5" gutterBottom>
              {qrCodeData.promotion.name}
            </Typography>

            {qrCodeData.promotion.description && (
              <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                {qrCodeData.promotion.description}
              </Typography>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Scadenza
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {hasValidExpiryDate 
                      ? new Date(qrCodeData.promotion.expiryDate).toLocaleDateString()
                      : 'Nessuna scadenza'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {qrCodeData.business && (
          <Card>
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
                      {qrCodeData.business.phoneNumber}
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

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/verify/${qrCodeData.code}`)}
            disabled={!isActive}
          >
            Verifica QR Code
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PublicQRCodeDetail;