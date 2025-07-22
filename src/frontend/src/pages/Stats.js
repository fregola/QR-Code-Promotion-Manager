import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import axios from 'axios';

const Stats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    expiredPromotions: 0,
    totalQRCodes: 0,
    usedQRCodes: 0,
    totalScans: 0,
    promotionsByMonth: [],
    scansByMonth: [],
  });
  const [timeRange, setTimeRange] = useState('last6Months');

  const COLORS = ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all promotions
        const promotionsRes = await axios.get('/api/promotions?limit=1000');
        const promotions = promotionsRes.data.data;

        // Fetch all QR codes
        const qrCodesRes = await axios.get('/api/qrcodes?limit=1000');
        const qrCodes = qrCodesRes.data.data;

        // Calculate statistics
        const totalPromotions = promotions.length;
        const activePromotions = promotions.filter(p => p.active && new Date(p.expiryDate) > new Date()).length;
        const expiredPromotions = totalPromotions - activePromotions;
        const totalQRCodes = qrCodes.length;
        const usedQRCodes = qrCodes.filter(qr => qr.usageCount > 0).length;
        const totalScans = qrCodes.reduce((sum, qr) => sum + qr.usageCount, 0);

        // Calculate promotions by month
        const promotionsByMonth = calculateByMonth(promotions, 'createdAt', timeRange);

        // Calculate scans by month
        const scansByMonth = calculateScansByMonth(qrCodes, timeRange);

        setStats({
          totalPromotions,
          activePromotions,
          expiredPromotions,
          totalQRCodes,
          usedQRCodes,
          totalScans,
          promotionsByMonth,
          scansByMonth,
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Errore durante il recupero dei dati');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const calculateByMonth = (items, dateField, timeRange) => {
    // Create a map to store counts by month
    const countMap = new Map();

    // Determine start date based on time range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'last6Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    // Initialize all months in the range with zero count
    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      countMap.set(monthKey, 0);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Process each item
    items.forEach(item => {
      const date = new Date(item[dateField]);
      if (date >= startDate) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (countMap.has(monthKey)) {
          countMap.set(monthKey, countMap.get(monthKey) + 1);
        }
      }
    });

    // Convert the map to an array of objects
    const countArray = Array.from(countMap, ([month, count]) => {
      const [year, monthNum] = month.split('-');
      return {
        month,
        count,
        formattedMonth: `${getMonthName(parseInt(monthNum) - 1)} ${year}`,
      };
    });

    // Sort by month
    return countArray.sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculateScansByMonth = (qrCodes, timeRange) => {
    // Create a map to store scan counts by month
    const scanMap = new Map();

    // Determine start date based on time range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'last6Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    // Initialize all months in the range with zero count
    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      scanMap.set(monthKey, 0);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Process each QR code
    qrCodes.forEach(qrCode => {
      // Skip if no usage
      if (!qrCode.usageCount || !qrCode.lastUsed) return;

      const date = new Date(qrCode.lastUsed);
      if (date >= startDate) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (scanMap.has(monthKey)) {
          scanMap.set(monthKey, scanMap.get(monthKey) + qrCode.usageCount);
        }
      }
    });

    // Convert the map to an array of objects
    const scanArray = Array.from(scanMap, ([month, count]) => {
      const [year, monthNum] = month.split('-');
      return {
        month,
        count,
        formattedMonth: `${getMonthName(parseInt(monthNum) - 1)} ${year}`,
      };
    });

    // Sort by month
    return scanArray.sort((a, b) => a.month.localeCompare(b.month));
  };

  const getMonthName = (monthIndex) => {
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return months[monthIndex];
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
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
      </Box>
    );
  }

  // Prepare data for pie chart
  const promotionStatusData = [
    { name: 'Promozioni attive', value: stats.activePromotions },
    { name: 'Promozioni scadute', value: stats.expiredPromotions },
  ];

  const qrCodeUsageData = [
    { name: 'QR Code utilizzati', value: stats.usedQRCodes },
    { name: 'QR Code non utilizzati', value: stats.totalQRCodes - stats.usedQRCodes },
  ];

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Statistiche
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="time-range-label">Intervallo di tempo</InputLabel>
          <Select
            labelId="time-range-label"
            value={timeRange}
            onChange={handleTimeRangeChange}
            label="Intervallo di tempo"
          >
            <MenuItem value="last3Months">Ultimi 3 mesi</MenuItem>
            <MenuItem value="last6Months">Ultimi 6 mesi</MenuItem>
            <MenuItem value="lastYear">Ultimo anno</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Riepilogo promozioni
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body1" gutterBottom>
                Promozioni totali: {stats.totalPromotions}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Promozioni attive: {stats.activePromotions} ({((stats.activePromotions / stats.totalPromotions) * 100).toFixed(1)}%)
              </Typography>
              <Typography variant="body1" gutterBottom>
                Promozioni scadute: {stats.expiredPromotions} ({((stats.expiredPromotions / stats.totalPromotions) * 100).toFixed(1)}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Riepilogo QR Code
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body1" gutterBottom>
                QR Code totali: {stats.totalQRCodes}
              </Typography>
              <Typography variant="body1" gutterBottom>
                QR Code utilizzati: {stats.usedQRCodes} ({((stats.usedQRCodes / stats.totalQRCodes) * 100).toFixed(1)}%)
              </Typography>
              <Typography variant="body1" gutterBottom>
                Scansioni totali: {stats.totalScans}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Media utilizzo
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body1" gutterBottom>
                Media QR Code per promozione: {stats.totalPromotions ? (stats.totalQRCodes / stats.totalPromotions).toFixed(1) : 0}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Media scansioni per QR Code: {stats.totalQRCodes ? (stats.totalScans / stats.totalQRCodes).toFixed(1) : 0}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Media scansioni per promozione: {stats.totalPromotions ? (stats.totalScans / stats.totalPromotions).toFixed(1) : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stato promozioni
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={promotionStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {promotionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} promozioni`, null]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
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
                      data={qrCodeUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {qrCodeUsageData.map((entry, index) => (
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
                Promozioni create per mese
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.promotionsByMonth}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="formattedMonth"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} promozioni`, 'Promozioni create']} />
                    <Legend />
                    <Bar dataKey="count" name="Promozioni create" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scansioni QR Code per mese
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.scansByMonth}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="formattedMonth"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} scansioni`, 'Scansioni']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Scansioni QR Code"
                      stroke="#4caf50"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Stats;