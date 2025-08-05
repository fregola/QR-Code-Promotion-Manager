import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  LocalOffer as PromotionIcon,
  QrCode2 as QRCodeIcon,
  Visibility as ViewIcon,
  Timeline as TimelineIcon,
  Delete as DeleteIcon,
  VpnKey as PasswordIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';

const UserDetailModal = ({ open, onClose, userId, onUserUpdated }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
      fetchUserActivity();
    }
  }, [open, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
      } else {
        setError('Errore nel caricamento dettagli utente');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserActivity(data.activities || []);
      }
    } catch (err) {
      console.error('Errore nel caricamento attività:', err);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('Sei sicuro di voler resettare la password di questo utente?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Password resettata! Nuova password temporanea: ${data.tempPassword}`);
      } else {
        setError('Errore nel reset della password');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  const handleDeleteUser = async () => {
    const userName = userDetails?.user?.name;
    if (!window.confirm(`Sei sicuro di voler eliminare completamente l'utente "${userName}" e tutti i suoi dati? Questa azione è irreversibile!`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Utente eliminato con successo');
        setTimeout(() => {
          onUserUpdated();
          onClose();
        }, 2000);
      } else {
        setError('Errore nell\'eliminazione utente');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return <PersonIcon />;
      case 'promotion_created': return <PromotionIcon />;
      case 'qrcode_generated': return <QRCodeIcon />;
      default: return <TimelineIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'login': return 'primary';
      case 'promotion_created': return 'secondary';
      case 'qrcode_generated': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">
            Dettagli Utente: {userDetails?.user?.name}
          </Typography>
          <Box>
            <Tooltip title="Reset Password">
              <IconButton onClick={handleResetPassword} color="warning">
                <PasswordIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Elimina Utente">
              <IconButton onClick={handleDeleteUser} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Informazioni Generali" />
          <Tab label="Promozioni" />
          <Tab label="QR Codes" />
          <Tab label="Attività" />
        </Tabs>

        {/* Tab 0: Informazioni Generali */}
        {activeTab === 0 && userDetails && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Informazioni Utente
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText primary="Email" secondary={userDetails.user.email} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Ruolo" 
                        secondary={
                          <Chip 
                            label={userDetails.user.role} 
                            color={userDetails.user.role === 'admin' ? 'error' : 'primary'}
                            size="small"
                          />
                        } 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><ScheduleIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Registrato il" 
                        secondary={formatDate(userDetails.user.createdAt)} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><ScheduleIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Ultimo accesso" 
                        secondary={userDetails.user.lastLogin ? formatDate(userDetails.user.lastLogin) : 'Mai'} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <TrendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Statistiche
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><PromotionIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Promozioni Totali" 
                        secondary={userDetails.stats.totalPromotions} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PromotionIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Promozioni Attive" 
                        secondary={userDetails.stats.activePromotions} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><QRCodeIcon /></ListItemIcon>
                      <ListItemText 
                        primary="QR Codes Generati" 
                        secondary={userDetails.stats.totalQRCodes} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><ViewIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Visualizzazioni Totali" 
                        secondary={userDetails.stats.totalViews} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Promozioni */}
        {activeTab === 1 && userDetails && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Titolo</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Visualizzazioni</TableCell>
                  <TableCell>Data Creazione</TableCell>
                  <TableCell>Scadenza</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userDetails.promotions.map((promotion) => (
                  <TableRow key={promotion._id}>
                    <TableCell>{promotion.title}</TableCell>
                    <TableCell>
                      <Chip 
                        label={promotion.isActive ? 'Attiva' : 'Inattiva'}
                        color={promotion.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{promotion.views || 0}</TableCell>
                    <TableCell>{formatDate(promotion.createdAt)}</TableCell>
                    <TableCell>
                      {promotion.expiresAt ? formatDate(promotion.expiresAt) : 'Nessuna'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {userDetails.promotions.length === 0 && (
              <Box p={3} textAlign="center">
                <Typography color="text.secondary">
                  Nessuna promozione trovata
                </Typography>
              </Box>
            )}
          </TableContainer>
        )}

        {/* Tab 2: QR Codes */}
        {activeTab === 2 && userDetails && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Promozione</TableCell>
                  <TableCell>Codice</TableCell>
                  <TableCell>Scansioni</TableCell>
                  <TableCell>Ultima Scansione</TableCell>
                  <TableCell>Data Creazione</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userDetails.qrcodes.map((qrcode) => (
                  <TableRow key={qrcode._id}>
                    <TableCell>{qrcode.promotion?.title}</TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {qrcode.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{qrcode.scans || 0}</TableCell>
                    <TableCell>
                      {qrcode.lastScanned ? formatDate(qrcode.lastScanned) : 'Mai'}
                    </TableCell>
                    <TableCell>{formatDate(qrcode.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {userDetails.qrcodes.length === 0 && (
              <Box p={3} textAlign="center">
                <Typography color="text.secondary">
                  Nessun QR Code trovato
                </Typography>
              </Box>
            )}
          </TableContainer>
        )}

        {/* Tab 3: Attività */}
        {activeTab === 3 && (
          <List>
            {userActivity.map((activity, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      icon={getActivityIcon(activity.type)}
                      label={activity.type.replace('_', ' ')}
                      color={getActivityColor(activity.type)}
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.description}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {formatDate(activity.date)}
                        </Typography>
                        {activity.details && (
                          <Typography variant="caption" color="text.secondary">
                            {activity.details}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < userActivity.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {userActivity.length === 0 && (
              <Box p={3} textAlign="center">
                <Typography color="text.secondary">
                  Nessuna attività registrata
                </Typography>
              </Box>
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailModal;
