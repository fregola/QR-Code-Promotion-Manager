import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalOffer as PromotionIcon,
  QrCode2 as QRCodeIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminStats();
    fetchRecentActivity();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Errore nel caricamento delle statistiche');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/recent-activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (err) {
      console.error('Errore nel caricamento attività recenti:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Admin
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Benvenuto {user?.name}, ecco una panoramica del sistema
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistiche principali */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Utenti Totali
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalUsers || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PromotionIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Promozioni Totali
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalPromotions || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <QRCodeIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    QR Codes Totali
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalQRCodes || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ViewIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Visualizzazioni Totali
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalViews || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Statistiche aggiuntive */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Statistiche Avanzate
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Utenti Attivi (ultimi 30 giorni)"
                    secondary={stats?.activeUsers || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Promozioni Attive"
                    secondary={stats?.activePromotions || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="QR Codes Scansionati Oggi"
                    secondary={stats?.todayScans || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Nuovi Utenti (questa settimana)"
                    secondary={stats?.weeklyNewUsers || 0}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Attività recenti */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TodayIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Attività Recenti
              </Typography>
              {recentActivity.length > 0 ? (
                <List dense>
                  {recentActivity.map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {activity.type === 'user' && <PeopleIcon />}
                          {activity.type === 'promotion' && <PromotionIcon />}
                          {activity.type === 'qrcode' && <QRCodeIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.description}
                          secondary={formatDate(activity.createdAt)}
                        />
                        <Chip 
                          label={activity.type} 
                          size="small" 
                          color={
                            activity.type === 'user' ? 'primary' : 
                            activity.type === 'promotion' ? 'secondary' : 'success'
                          }
                        />
                      </ListItem>
                      {index < recentActivity.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Nessuna attività recente
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
