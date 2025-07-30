import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Grid,
  IconButton,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Email as EmailIcon,
  ContentCopy as ContentCopyIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ShareDialog = ({ open, onClose, qrCode, onShareComplete }) => {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleClose = () => {
    setMessage('');
    setRecipient('');
    onClose();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const recordShare = async (platform) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/qrcodes/${qrCode._id}/share`, {
        platform,
        message: message || undefined,
        recipient: recipient || undefined
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      showSnackbar(`QR Code condiviso con successo su ${platform}`);
      
      // Callback per aggiornare la UI del componente padre
      if (onShareComplete) {
        onShareComplete();
      }
    } catch (error) {
      console.error('Errore durante la registrazione della condivisione:', error);
      showSnackbar('Errore durante la registrazione della condivisione', 'error');
    }
  };

  const handleShare = (platform, url) => {
    window.open(url, '_blank');
    recordShare(platform);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/public/qrcode/${qrCode._id}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        showSnackbar('Link copiato negli appunti');
        recordShare('Clipboard');
      })
      .catch(err => {
        console.error('Errore durante la copia del link:', err);
        showSnackbar('Errore durante la copia del link', 'error');
      });
  };

  const handleEmailShare = () => {
    const subject = 'Condivisione QR Code';
    const body = message || `Ecco il QR Code che ti ho condiviso: ${window.location.origin}/public/qrcode/${qrCode._id}`;
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    recordShare('Email');
  };

  const getShareUrl = (platform) => {
    const url = `${window.location.origin}/public/qrcode/${qrCode._id}`;
    const text = message || 'Ecco un QR Code che voglio condividere con te!';
    
    switch (platform) {
      case 'Facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      case 'Twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      case 'WhatsApp':
        return `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
      case 'Telegram':
        return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      default:
        return '';
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Condividi QR Code</Typography>
            <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Destinatario (opzionale)
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Email o nome del destinatario (opzionale)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Box>
          
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Personalizza il tuo messaggio (opzionale)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder="Scrivi un messaggio personalizzato..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Condividi sui social
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <IconButton 
                  color="primary" 
                  onClick={() => handleShare('Facebook', getShareUrl('Facebook'))}
                  sx={{ bgcolor: '#e8f4ff', mb: 1 }}
                >
                  <FacebookIcon />
                </IconButton>
                <Typography variant="caption">Facebook</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <IconButton 
                  color="primary" 
                  onClick={handleEmailShare}
                  sx={{ bgcolor: '#e8f4ff', mb: 1 }}
                >
                  <EmailIcon />
                </IconButton>
                <Typography variant="caption">Email</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <IconButton 
                  color="primary" 
                  onClick={() => handleShare('WhatsApp', getShareUrl('WhatsApp'))}
                  sx={{ bgcolor: '#e8f4ff', mb: 1 }}
                >
                  <WhatsAppIcon />
                </IconButton>
                <Typography variant="caption">WhatsApp</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <IconButton 
                  color="primary" 
                  onClick={() => handleShare('Telegram', getShareUrl('Telegram'))}
                  sx={{ bgcolor: '#e8f4ff', mb: 1 }}
                >
                  <TelegramIcon />
                </IconButton>
                <Typography variant="caption">Telegram</Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          

          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Copia link
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyLink}
              fullWidth
            >
              Copia Link
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareDialog;