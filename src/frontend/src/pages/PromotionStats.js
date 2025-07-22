import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import axios from 'axios';

const PromotionStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const [stats, setStats] = useState({
    totalQRCodes: 0,
    usedQRCodes: 0,
    unusedQRCodes: 0,
    totalScans: 0,
    usageByDay: [],
  });

  const COLORS = ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch promotion details
        const promotionRes = await axios.get(`/api/promotions/${id}`);
        setPromotion(promotionRes.data.data);

        // Fetch QR codes for this promotion
        const qrCodesRes = await axios.get(`/api/qrcodes?promotion=${id}&limit=1000`);
        setQrCodes(qrCodesRes.data.data);

        // Calculate statistics
        const qrCodesData = qrCodesRes.data.data;
        const totalQRCodes = qrCodesData.length;
        const usedQRCodes = qrCodesData.filter(qr => qr.usageCount > 0).length;
        const unusedQRCodes = totalQRCodes - usedQRCodes;
        const totalScans = qrCodesData.reduce((sum, qr) => sum + qr.usageCount, 0);

        // Calculate usage by day
        const usageByDay = calculateUsageByDay(qrCodesData);

        setStats({
          totalQRCodes,
          usedQRCodes,
          unusedQRCodes,
          totalScans,
          usageByDay,
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Errore durante il recupero dei dati');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      setError('ID promozione non valido');
      setLoading(false);
    }
  }, [id]);

  const calculateUsageByDay = (qrCodes) => {
    // Create a map to store usage counts by day
    const usageMap = new Map();

    // Process each QR code
    qrCodes.forEach(qrCode => {
      // Skip if no usage
      if (!qrCode.usageCount || !qrCode.lastUsed) return;

      // Get the date string (YYYY-MM-DD)
      const date = new Date(qrCode.lastUsed).toISOString().split('T')[0];
      
      // Update the count for this date
      if (usageMap.has(date)) {
        usageMap.set(date, usageMap.get(date) + qrCode.usageCount);
      } else {
        usageMap.set(date, qrCode.usageCount);
      }
    });

    // Convert the map to an array of objects
    const usageArray = Array.from(usageMap, ([date, count]) => ({
      date,
      count,
      formattedDate: new Date(date).toLocaleDateString(),
    }));

    // Sort by date
    return usageArray.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const handleBack = () => {
    navigate(`/promotions/${id}`);
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

  // Prepare data for pie chart
  const pieData = [
    { name: 'QR Code utilizzati', value: stats.usedQRCodes },
    { name: 'QR Code non utilizzati', value: stats.unusedQRCodes },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Statistiche: {promotion.name}
        </Typography>
        <Button variant="outlined" onClick={handleBack}>
          Torna alla promozione
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Riepilogo
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body1" gutterBottom>
                QR Code totali: {stats.totalQRCodes}
              </Typography>
              <Typography variant="body1" gutterBottom>
                QR Code utilizzati: {stats.usedQRCodes} ({((stats.usedQRCodes / stats.totalQRCodes) * 100).toFixed(1)}%)
              </Typography>
              <Typography variant="body1" gutterBottom>
                QR Code non utilizzati: {stats.unusedQRCodes} ({((stats.unusedQRCodes / stats.totalQRCodes) * 100).toFixed(1)}%)
              </Typography>
              <Typography variant="body1" gutterBottom>
                Scansioni totali: {stats.totalScans}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Utilizzo QR Code
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} QR Code`, null]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Utilizzo per giorno
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {stats.usageByDay.length > 0 ? (
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.usageByDay}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="formattedDate"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} scansioni`, 'Utilizzo']} />
                      <Legend />
                      <Bar dataKey="count" name="Scansioni" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Alert severity="info">
                  Nessun dato di utilizzo disponibile per questa promozione.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default PromotionStats;