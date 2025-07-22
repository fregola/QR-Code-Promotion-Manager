import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import axios from 'axios';

const PromotionCreate = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expiryDate: null,
    isActive: true,
    maxUsageCount: 1,
    qrCodesCount: 1,
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Il nome della promozione è obbligatorio';
    }

    if (formData.qrCodesCount < 1) {
      errors.qrCodesCount = 'Devi generare almeno 1 QR code';
    }

    if (formData.maxUsageCount < 1) {
      errors.maxUsageCount = 'Il numero massimo di utilizzi deve essere almeno 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear field error when typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      expiryDate: date,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      setError(null);

      try {
        // Prepare data for submission
        const promotionData = {
          ...formData,
          expiryDate: formData.expiryDate ? formData.expiryDate.toISOString() : null,
        };

        await axios.post('/api/promotions', promotionData);
        setSuccess(true);
        setTimeout(() => {
          navigate('/promotions');
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.error || 'Errore durante la creazione della promozione');
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Crea Nuova Promozione
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Promozione creata con successo! Reindirizzamento in corso...
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Promozione"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={loading}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrizione"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Data di Scadenza (opzionale)"
                  value={formData.expiryDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      disabled: loading
                    }
                  }}
                  minDate={dayjs()}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numero di QR Code da Generare"
                name="qrCodesCount"
                type="number"
                value={formData.qrCodesCount}
                onChange={handleChange}
                error={!!formErrors.qrCodesCount}
                helperText={formErrors.qrCodesCount}
                disabled={loading}
                InputProps={{
                  inputProps: { min: 1 },
                }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numero Massimo di Utilizzi per QR Code"
                name="maxUsageCount"
                type="number"
                value={formData.maxUsageCount}
                onChange={handleChange}
                error={!!formErrors.maxUsageCount}
                helperText={formErrors.maxUsageCount}
                disabled={loading}
                InputProps={{
                  inputProps: { min: 1 },
                  startAdornment: <InputAdornment position="start">Max</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleChange}
                    name="isActive"
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Promozione Attiva"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/promotions')}
                  disabled={loading}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Crea Promozione'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </>
  );
};

export default PromotionCreate;