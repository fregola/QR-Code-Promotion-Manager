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
import ShareIcon from '@mui/icons-material/Share';

// Components
import ShareDialog from '../components/ShareDialog';

const PublicQRCodeDetail = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

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
        <Card sx={{ mb: 3 }}>
          <CardContent>
            {qrCodeData.business && qrCodeData.business.businessLogo && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box 
                  component="img"
                  src={qrCodeData.business.businessLogo}
                  alt="Logo aziendale"
                  sx={{ 
                    maxWidth: '200px', 
                    maxHeight: '150px',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            )}
            
            <Typography variant="h4" gutterBottom align="center">
              {qrCodeData.promotion.name}
            </Typography>

            {qrCodeData.promotion.description && (
              <Typography variant="h6" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
                {qrCodeData.promotion.description}
              </Typography>
            )}

            {qrCodeData.qrImagePath && (
               <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                 <Box
                   component="img"
                   src={qrCodeData.qrImagePath}
                   alt={`QR Code ${qrCodeData.code}`}
                   sx={{
                     maxWidth: '200px',
                     maxHeight: '200px',
                     objectFit: 'contain',
                     border: '1px solid #e0e0e0',
                     borderRadius: 1,
                     p: 1,
                     bgcolor: 'white'
                   }}
                 />
               </Box>
             )}

             <Box sx={{ textAlign: 'center', mb: 3 }}>
               {qrCodeData.usageCount >= qrCodeData.maxUsageCount ? (
                 <Typography variant="body1" sx={{ mb: 1, color: 'error.main' }}>
                   <strong>Promozione già utilizzata il {new Date(qrCodeData.lastUsedAt).toLocaleDateString()}</strong>
                 </Typography>
               ) : (
                 <Box sx={{ color: 'success.main', mb: 1 }}>
                   <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                     🎉 La tua promozione è attiva!
                   </Typography>
                   <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                     Puoi utilizzare questa promozione {qrCodeData.maxUsageCount - qrCodeData.usageCount} {qrCodeData.maxUsageCount - qrCodeData.usageCount === 1 ? 'volta' : 'volte'}
                   </Typography>
                   {hasValidExpiryDate && (
                     <Typography variant="body1" sx={{ color: 'orange.main', mt: 1, fontWeight: 'bold' }}>
                       La tua promozione scade il {new Date(qrCodeData.promotion.expiryDate).toLocaleDateString('it-IT')}
                     </Typography>
                   )}
                 </Box>
               )}
               
               {qrCodeData.usageCount > 0 && qrCodeData.usageCount < qrCodeData.maxUsageCount && qrCodeData.lastUsedAt && (
                 <Typography variant="body2" color="textSecondary">
                   Ultimo utilizzo: {new Date(qrCodeData.lastUsedAt).toLocaleDateString()}
                 </Typography>
               )}
             </Box>

            {qrCodeData.business && qrCodeData.business.phoneNumber && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Typography variant="h6" color="primary">
                  📞 {qrCodeData.business.phoneNumber}
                </Typography>
              </Box>
            )}
            
            {/* Pulsante Condividi */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ShareIcon />}
                onClick={() => setShareDialogOpen(true)}
                sx={{ px: 4, py: 1.5 }}
              >
                Condividi questa promozione
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Paper>
      
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        qrCode={qrCodeData}
        title="Condividi questa promozione"
      />
    </Box>
  );
};

export default PublicQRCodeDetail;