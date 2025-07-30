import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Paper
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
  Telegram as TelegramIcon,
  Email as EmailIcon,
  ContentCopy as ContentCopyIcon,
  Share as ShareIcon
} from '@mui/icons-material';

const ShareHistory = ({ qrCode }) => {
  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <FacebookIcon color="primary" />;
      case 'twitter':
        return <TwitterIcon color="primary" />;
      case 'whatsapp':
        return <WhatsAppIcon color="success" />;
      case 'telegram':
        return <TelegramIcon color="info" />;
      case 'email':
        return <EmailIcon color="secondary" />;
      case 'clipboard':
        return <ContentCopyIcon color="action" />;
      default:
        return <ShareIcon color="action" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!qrCode.shares || qrCode.shares.length === 0) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Nessuna condivisione registrata
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 1 }}>
      <List dense>
        {qrCode.shares.map((share, index) => (
          <ListItem key={index} divider={index < qrCode.shares.length - 1}>
            <ListItemIcon>
              {getPlatformIcon(share.platform)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {share.platform}
                  </Typography>
                  {share.recipient && (
                    <Chip 
                      label={share.recipient} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(share.sharedAt)}
                  </Typography>
                  {share.message && (
                    <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                      "{share.message}"
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 1, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Totale condivisioni: {qrCode.totalShares || qrCode.shares.length}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ShareHistory;