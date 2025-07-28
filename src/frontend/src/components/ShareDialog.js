import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Grid,
  Paper,
  Divider,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
  Telegram as TelegramIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';

const ShareDialog = ({ open, onClose, qrCode, title = "Condividi QR Code" }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [shareHistory, setShareHistory] = useState([]);
  
  // Carica la cronologia delle condivisioni dal localStorage
  useEffect(() => {
    if (qrCode?.code) {
      const savedHistory = localStorage.getItem(`share_history_${qrCode.code}`);
      if (savedHistory) {
        setShareHistory(JSON.parse(savedHistory));
      }
    }
  }, [qrCode?.code]);
  
  if (!qrCode) return null;
  
  const publicUrl = `${window.location.origin}/qrcode/${qrCode.code}`;
  const defaultMessage = `Guarda questa promozione: ${qrCode.promotion?.name || 'QR Code'}`;
  const shareText = customMessage || defaultMessage;
  const fullMessage = `${shareText}\n\n${publicUrl}`;

  // Funzione per aggiungere una condivisione alla cronologia
  const addToShareHistory = (platform, message, recipient = null) => {
    const newShare = {
      id: Date.now(),
      platform,
      message,
      recipient: recipient || null,
      timestamp: new Date().toLocaleString('it-IT'),
      url: publicUrl
    };
    
    const updatedHistory = [newShare, ...shareHistory].slice(0, 10); // Mantieni solo le ultime 10
    setShareHistory(updatedHistory);
    
    // Salva nel localStorage
    if (qrCode?.code) {
      localStorage.setItem(`share_history_${qrCode.code}`, JSON.stringify(updatedHistory));
    }
    
    // Reset del campo nome destinatario dopo la condivisione
    setRecipientName('');
  };

  const handleWhatsAppShare = () => {
    const message = `${shareText}\n\n${publicUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    addToShareHistory('WhatsApp', shareText, recipientName.trim() || null);
  };

  const tryOpenApp = (appUrl, webUrl, windowOptions = '_blank') => {
    // Prova ad aprire l'app
    const startTime = Date.now();
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appUrl;
    document.body.appendChild(iframe);
    
    // Rimuovi l'iframe dopo un breve periodo
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 100);
    
    // Se dopo 1.5 secondi la pagina è ancora attiva, apri la versione web
    setTimeout(() => {
      const endTime = Date.now();
      // Se la differenza di tempo è piccola, probabilmente l'app non si è aperta
      if (endTime - startTime < 2000) {
        window.open(webUrl, windowOptions);
      }
    }, 1500);
  };

  const handleSmsShare = () => {
    const message = `${shareText}\n\n${publicUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    
    window.open(smsUrl);
    addToShareHistory('SMS', shareText, recipientName.trim() || null);
  };

  const handleTelegramShare = () => {
    const telegramApp = `tg://msg_url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(shareText)}`;
    const telegramWeb = `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(shareText)}`;
    
    tryOpenApp(telegramApp, telegramWeb);
    addToShareHistory('Telegram', shareText, recipientName.trim() || null);
  };

  const handleEmailShare = () => {
    const subject = shareText;
    const body = `Ciao!\n\n${shareText}\n\n${publicUrl}\n\nSaluti`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(emailUrl);
    addToShareHistory('Email', shareText, recipientName.trim() || null);
  };

  const handleFacebookShare = () => {
    const facebookApp = `fb://share?link=${encodeURIComponent(publicUrl)}`;
    const facebookWeb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
    
    tryOpenApp(facebookApp, facebookWeb, 'width=600,height=400');
    addToShareHistory('Facebook', shareText, recipientName.trim() || null);
  };

  const handleTwitterShare = () => {
    const twitterApp = `twitter://post?message=${encodeURIComponent(shareText + ' ' + publicUrl)}`;
    const twitterWeb = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(publicUrl)}`;
    
    tryOpenApp(twitterApp, twitterWeb, 'width=600,height=400');
    addToShareHistory('Twitter', shareText, recipientName.trim() || null);
  };

  const handleLinkedInShare = () => {
    const linkedinApp = `linkedin://sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`;
    const linkedinWeb = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`;
    
    tryOpenApp(linkedinApp, linkedinWeb, 'width=600,height=400');
    addToShareHistory('LinkedIn', shareText, recipientName.trim() || null);
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicUrl);
        setSnackbarMessage('Link copiato negli appunti!');
      } else {
        // Fallback per browser che non supportano l'API Clipboard
        const textArea = document.createElement('textarea');
        textArea.value = publicUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setSnackbarMessage('Link copiato negli appunti!');
        } else {
          setSnackbarMessage('Impossibile copiare automaticamente. Link: ' + publicUrl);
        }
      }
      setSnackbarOpen(true);
      addToShareHistory('Copia Link', shareText, recipientName.trim() || null);
    } catch (error) {
      console.error('Errore durante la copia:', error);
      setSnackbarMessage('Errore durante la copia. Link: ' + publicUrl);
      setSnackbarOpen(true);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code: ${qrCode.code}`,
          text: shareText,
          url: publicUrl,
        });
        addToShareHistory('Condivisione Nativa', shareText, recipientName.trim() || null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Errore durante la condivisione nativa:', error);
        }
      }
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: <WhatsAppIcon sx={{ fontSize: 40, color: '#25D366' }} />,
      onClick: handleWhatsAppShare,
      description: 'Condividi su WhatsApp'
    },
    {
      name: 'Telegram',
      icon: <TelegramIcon sx={{ fontSize: 40, color: '#0088cc' }} />,
      onClick: handleTelegramShare,
      description: 'Condividi su Telegram'
    },
    {
      name: 'SMS',
      icon: <SmsIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      onClick: handleSmsShare,
      description: 'Invia tramite SMS'
    },
    {
      name: 'Email',
      icon: <EmailIcon sx={{ fontSize: 40, color: '#EA4335' }} />,
      onClick: handleEmailShare,
      description: 'Invia tramite email'
    },
    {
      name: 'Facebook',
      icon: <FacebookIcon sx={{ fontSize: 40, color: '#1877F2' }} />,
      onClick: handleFacebookShare,
      description: 'Condividi su Facebook'
    },
    {
      name: 'Twitter',
      icon: <TwitterIcon sx={{ fontSize: 40, color: '#1DA1F2' }} />,
      onClick: handleTwitterShare,
      description: 'Condividi su Twitter'
    },
    {
      name: 'LinkedIn',
      icon: <LinkedInIcon sx={{ fontSize: 40, color: '#0A66C2' }} />,
      onClick: handleLinkedInShare,
      description: 'Condividi su LinkedIn'
    },
    {
      name: 'Copia Link',
      icon: <CopyIcon sx={{ fontSize: 40, color: '#666' }} />,
      onClick: handleCopyLink,
      description: 'Copia link negli appunti'
    }
  ];

  // Aggiungi l'opzione di condivisione nativa se supportata
  if (navigator.share) {
    shareOptions.push({
      name: 'Altro',
      icon: <ShareIcon sx={{ fontSize: 40, color: '#666' }} />,
      onClick: handleNativeShare,
      description: 'Altre opzioni di condivisione'
    });
  }

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {/* Informazioni QR Code */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom>
              {qrCode.promotion?.name || 'QR Code'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Codice: {qrCode.code}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ 
              wordBreak: 'break-all',
              fontSize: '0.875rem'
            }}>
              Link: {publicUrl}
            </Typography>
          </Paper>

          {/* Campo messaggio personalizzato */}
          <TextField
             fullWidth
             multiline
             rows={3}
             label="Messaggio personalizzato"
             placeholder={defaultMessage}
             value={customMessage}
             onChange={(e) => setCustomMessage(e.target.value)}
             sx={{ mb: 2 }}
             helperText="Lascia vuoto per usare il messaggio predefinito"
           />
           
          {/* Campo nome destinatario */}
          <TextField
             fullWidth
             label="Nome destinatario (promemoria)"
             placeholder="Es. Mario Rossi"
             value={recipientName}
             onChange={(e) => setRecipientName(e.target.value)}
             sx={{ mb: 2 }}
             helperText="Campo opzionale per tenere traccia del destinatario"
           />
           


          <Divider sx={{ mb: 3 }} />

          {/* Opzioni di condivisione */}
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
            Scegli come condividere:
          </Typography>
          
          <Grid container spacing={2}>
            {shareOptions.map((option, index) => (
              <Grid item xs={6} sm={4} key={index}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={option.onClick}
                >
                  <Box sx={{ mb: 1 }}>
                    {option.icon}
                  </Box>
                  <Typography variant="body2" fontWeight="medium">
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                    {option.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Cronologia delle condivisioni */}
          {shareHistory.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                Cronologia condivisioni:
              </Typography>
              <Paper sx={{ maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {shareHistory.map((share) => (
                    <ListItem key={share.id}>
                      <ListItemIcon>
                        <Chip 
                          label={share.platform} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={share.message}
                        secondary={
                          <>
                            {share.recipient && (
                              <Typography variant="caption" display="block" color="primary">
                                Destinatario: {share.recipient}
                              </Typography>
                            )}
                            <Typography variant="caption" display="block">
                              {share.timestamp}
                            </Typography>
                          </>
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
                  ))}
                </List>
              </Paper>
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'success.main',
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

export default ShareDialog;