import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Paper,
  Button,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  CloudDownload as CloudDownloadIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import axios from 'axios';
import JSZip from 'jszip';

const PromotionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [promotion, setPromotion] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(location.state?.edit || false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expiryDate: null,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedQrCode, setSelectedQrCode] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPromotionData = async () => {
      try {
        // Fetch promotion details
        const promotionRes = await axios.get(`/api/promotions/${id}`);
        const promotionData = promotionRes.data.data;
        setPromotion(promotionData);
        
        // Set form data for editing
        setFormData({
          name: promotionData.name,
          description: promotionData.description || '',
          expiryDate: promotionData.expiryDate ? dayjs(promotionData.expiryDate) : null,
          isActive: promotionData.isActive,
        });
        
        // Fetch QR codes for this promotion
        const qrCodesRes = await axios.get(`/api/qrcodes?promotion=${id}`);
        setQrCodes(qrCodesRes.data.data);
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Errore nel caricamento dei dati della promozione');
        setLoading(false);
      }
    };

    fetchPromotionData();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Il nome della promozione è obbligatorio';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

        const res = await axios.put(`/api/promotions/${id}`, promotionData);
        setPromotion(res.data.data);
        setEditMode(false);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Errore durante l\'aggiornamento della promozione');
        setLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Sei sicuro di voler eliminare questa promozione? Questa azione non può essere annullata.')) {
      try {
        await axios.delete(`/api/promotions/${id}`);
        navigate('/promotions');
      } catch (err) {
        setError(err.response?.data?.error || 'Errore durante l\'eliminazione della promozione');
      }
    }
  };

  const handleQrCodeClick = (qrCode) => {
    setSelectedQrCode(qrCode);
    setQrDialogOpen(true);
  };

  const downloadQrCode = (qrCode) => {
    if (qrCode?.qrImagePath) {
      // Fetch the image as a blob
      fetch(qrCode.qrImagePath)
        .then(response => response.blob())
        .then(blob => {
          // Create a blob URL
          const blobUrl = URL.createObjectURL(blob);
          
          // Create a temporary anchor element
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `qrcode-${qrCode.code}.png`;
          
          // Append to body, click and remove
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Release the blob URL
          URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
          console.error('Errore durante il download del QR code:', error);
          alert('Si è verificato un errore durante il download del QR code. Riprova più tardi.');
        });
    }
  };

  const downloadAllQrCodes = async () => {
    if (qrCodes.length === 0) {
      alert('Non ci sono QR code da scaricare per questa campagna.');
      return;
    }

    try {
      setLoading(true);
      const zip = new JSZip();
      const folder = zip.folder(`campagna-${promotion.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`);
      
      // Create a promise for each QR code download
      const downloadPromises = qrCodes.map(async (qrCode) => {
        try {
          const response = await fetch(qrCode.qrImagePath);
          const blob = await response.blob();
          folder.file(`qrcode-${qrCode.code}.png`, blob);
          return true;
        } catch (error) {
          console.error(`Errore durante il download del QR code ${qrCode.code}:`, error);
          return false;
        }
      });

      // Wait for all downloads to complete
      await Promise.all(downloadPromises);
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Create a download link
      const blobUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `campagna-${promotion.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.zip`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the blob URL
      URL.revokeObjectURL(blobUrl);
      setLoading(false);
    } catch (error) {
      console.error('Errore durante il download della campagna:', error);
      alert('Si è verificato un errore durante il download della campagna. Riprova più tardi.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!promotion && !loading) {
    return (
      <Alert severity="error">
        Promozione non trovata. <Button onClick={() => navigate('/promotions')}>Torna all'elenco</Button>
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {editMode ? 'Modifica Promozione' : 'Dettagli Promozione'}
        </Typography>
        <Box>
          {!editMode ? (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CloudDownloadIcon />}
                onClick={downloadAllQrCodes}
                sx={{ mr: 1 }}
                disabled={loading || qrCodes.length === 0}
              >
                Scarica Campagna
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                sx={{ mr: 1 }}
              >
                Modifica
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Elimina
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => setEditMode(false)}
                sx={{ mr: 1 }}
              >
                Annulla
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                Salva
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        {editMode ? (
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
            </Grid>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Nome
              </Typography>
              <Typography variant="h6">{promotion.name}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Stato
              </Typography>
              <Chip
                label={promotion.isActive ? 'Attiva' : 'Inattiva'}
                color={promotion.isActive ? 'success' : 'error'}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Data Creazione
              </Typography>
              <Typography variant="body1">
                {new Date(promotion.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Data Scadenza
              </Typography>
              <Typography variant="body1">
                {promotion.expiryDate
                  ? new Date(promotion.expiryDate).toLocaleDateString()
                  : 'Nessuna scadenza'}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Numero QR Code
              </Typography>
              <Typography variant="body1">{promotion.qrCodesCount}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Utilizzi Massimi per QR Code
              </Typography>
              <Typography variant="body1">{promotion.maxUsageCount}</Typography>
            </Grid>

            {promotion.description && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="textSecondary">
                  Descrizione
                </Typography>
                <Typography variant="body1">{promotion.description}</Typography>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="QR Codes" />
          <Tab label="Statistiche" />
        </Tabs>
      </Box>

      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        <Typography variant="h6" gutterBottom>
          QR Codes Generati ({qrCodes.length})
        </Typography>

        {qrCodes.length > 0 ? (
          <div className="qr-code-container">
            {qrCodes.map((qrCode) => (
              <Card key={qrCode._id} sx={{ maxWidth: 200, m: 1 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={qrCode.qrImagePath}
                  alt={`QR Code ${qrCode.code}`}
                  onClick={() => handleQrCodeClick(qrCode)}
                  sx={{ cursor: 'pointer' }}
                />
                <CardContent>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Codice: {qrCode.code}
                  </Typography>
                  <Typography variant="body2">
                    Utilizzi: {qrCode.usageCount}/{qrCode.maxUsageCount}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadQrCode(qrCode)}
                    sx={{ mt: 1 }}
                    fullWidth
                  >
                    Scarica
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Typography variant="body1" color="textSecondary">
            Nessun QR code disponibile per questa promozione.
          </Typography>
        )}
      </Box>

      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        <Typography variant="h6" gutterBottom>
          Statistiche di Utilizzo
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle1" color="textSecondary">
                QR Code Totali
              </Typography>
              <Typography variant="h4">{qrCodes.length}</Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle1" color="textSecondary">
                QR Code Utilizzati
              </Typography>
              <Typography variant="h4">
                {qrCodes.filter((qr) => qr.usageCount > 0).length}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle1" color="textSecondary">
                QR Code Esauriti
              </Typography>
              <Typography variant="h4">
                {qrCodes.filter((qr) => qr.usageCount >= qr.maxUsageCount).length}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" color="textSecondary">
                Tasso di Utilizzo
              </Typography>
              <Typography variant="h4">
                {qrCodes.length > 0
                  ? `${Math.round(
                      (qrCodes.filter((qr) => qr.usageCount > 0).length / qrCodes.length) * 100
                    )}%`
                  : '0%'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>QR Code: {selectedQrCode?.code}</DialogTitle>
        <DialogContent>
          {selectedQrCode && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={selectedQrCode.qrImagePath}
                alt={`QR Code ${selectedQrCode.code}`}
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Codice: {selectedQrCode.code}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Utilizzi: {selectedQrCode.usageCount}/{selectedQrCode.maxUsageCount}
              </Typography>
              {selectedQrCode.lastUsedAt && (
                <Typography variant="body2" color="textSecondary">
                  Ultimo utilizzo: {new Date(selectedQrCode.lastUsedAt).toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Chiudi</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => downloadQrCode(selectedQrCode)}
          >
            Scarica
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PromotionDetail;