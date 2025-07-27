import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocalOffer as LocalOfferIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    totalQRCodes: 0,
    usedQRCodes: 0,
  });
  const [recentPromotions, setRecentPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch promotions
        const promotionsRes = await axios.get('/api/promotions');
        const promotions = promotionsRes.data.data;
        
        // Fetch QR codes
        const qrCodesRes = await axios.get('/api/qrcodes');
        const qrCodes = qrCodesRes.data.data;
        
        // Calculate stats
        const activePromotions = promotions.filter(p => p.isActive).length;
        const usedQRCodes = qrCodes.filter(q => q.isUsed).length;
        
        setStats({
          totalPromotions: promotions.length,
          activePromotions,
          totalQRCodes: qrCodes.length,
          usedQRCodes,
        });
        
        // Get recent promotions (last 5)
        setRecentPromotions(promotions.slice(0, 5));
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Errore nel caricamento dei dati');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const pieData = {
    labels: ['Attive', 'Inattive'],
    datasets: [
      {
        data: [stats.activePromotions, stats.totalPromotions - stats.activePromotions],
        backgroundColor: ['#4caf50', '#f44336'],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['QR Code Totali', 'QR Code Utilizzati'],
    datasets: [
      {
        label: 'Numero',
        data: [stats.totalQRCodes, stats.usedQRCodes],
        backgroundColor: ['#2196f3', '#ff9800'],
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Utilizzo QR Code',
      },
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/promotions/create')}
        >
          Nuova Promozione
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <div className="dashboard-stats">
        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocalOfferIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <div>
              <Typography variant="h6">Promozioni Totali</Typography>
              <Typography variant="h4">{stats.totalPromotions}</Typography>
            </div>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
            <div>
              <Typography variant="h6">Promozioni Attive</Typography>
              <Typography variant="h4">{stats.activePromotions}</Typography>
            </div>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <QrCodeIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
            <div>
              <Typography variant="h6">QR Code Totali</Typography>
              <Typography variant="h4">{stats.totalQRCodes}</Typography>
            </div>
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <QrCodeIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
            <div>
              <Typography variant="h6">QR Code Utilizzati</Typography>
              <Typography variant="h4">{stats.usedQRCodes}</Typography>
            </div>
          </Box>
        </Paper>
      </div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stato Promozioni
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {stats.totalPromotions > 0 ? (
                <Pie data={pieData} />
              ) : (
                <Typography variant="body1" color="textSecondary">
                  Nessuna promozione disponibile
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Utilizzo QR Code
            </Typography>
            <Box sx={{ height: 300 }}>
              {stats.totalQRCodes > 0 ? (
                <Bar options={barOptions} data={barData} />
              ) : (
                <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    Nessun QR code disponibile
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Promozioni Recenti
            </Typography>
            {recentPromotions.length > 0 ? (
              <Grid container spacing={2}>
                {recentPromotions.map((promotion) => (
                  <Grid item xs={12} sm={6} md={4} key={promotion._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" noWrap>
                          {promotion.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Creata: {new Date(promotion.createdAt).toLocaleDateString()}
                        </Typography>
                        {promotion.expiryDate && (
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Scadenza: {new Date(promotion.expiryDate).toLocaleDateString()}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          QR Code: {promotion.qrCodesCount}
                        </Typography>
                        <Typography variant="body2">
                          Stato: {promotion.isActive ? 'Attiva' : 'Inattiva'}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1 }}
                          onClick={() => navigate(`/promotions/${promotion._id}`)}
                        >
                          Dettagli
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="textSecondary">
                Nessuna promozione disponibile. Crea la tua prima promozione!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;