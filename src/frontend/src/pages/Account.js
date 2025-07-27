import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../context/AuthContext';

const Account = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    // Campi aziendali opzionali
    businessName: '',
    businessType: '',
    address: '',
    city: '',
    postalCode: '',
    vatNumber: '',
    phoneNumber: '',
    website: '',
    businessLogo: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        name: user.name || '',
        email: user.email || '',
        // Popola i campi aziendali se esistono
        businessName: user.businessName || '',
        businessType: user.businessType || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        vatNumber: user.vatNumber || '',
        phoneNumber: user.phoneNumber || '',
        website: user.website || '',
        businessLogo: user.businessLogo || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClickShowCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const handleClickShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleClickShowConfirmNewPassword = () => {
    setShowConfirmNewPassword(!showConfirmNewPassword);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Include name, email and business fields for profile update
      const profileData = {
        name: formData.name,
        email: formData.email,
        // Includi i campi aziendali
        businessName: formData.businessName,
        businessType: formData.businessType,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        vatNumber: formData.vatNumber,
        phoneNumber: formData.phoneNumber,
        website: formData.website,
        businessLogo: formData.businessLogo,
      };

      // Se è stato caricato un nuovo file logo, gestisci l'upload
      if (logoFile) {
        // Converti il file in base64 per l'invio al server
        const reader = new FileReader();
        reader.readAsDataURL(logoFile);
        reader.onloadend = async () => {
          profileData.businessLogo = reader.result;
          await submitProfileUpdate(profileData);
        };
      } else {
        await submitProfileUpdate(profileData);
      }
    } catch (err) {
      setError('Errore durante l\'aggiornamento del profilo');
      setLoading(false);
    }
  };

  const submitProfileUpdate = async (profileData) => {
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccess('Profilo aggiornato con successo');
        // Reset del file logo dopo l'upload
        setLogoFile(null);
      } else {
        setError(result.error || 'Errore durante l\'aggiornamento del profilo');
      }
    } catch (err) {
      setError('Errore durante l\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('Le nuove password non corrispondono');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('La nuova password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const passwordData = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };

      const result = await updatePassword(passwordData);
      if (result.success) {
        setSuccess('Password aggiornata con successo');
        
        // Clear password fields
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } else {
        setError(result.error || 'Errore durante l\'aggiornamento della password');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Errore durante l\'aggiornamento della password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Il mio account
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informazioni profilo
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box component="form" onSubmit={handleProfileUpdate}>
              <TextField
                fullWidth
                label="Nome"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
              />
              
              <Accordion sx={{ mt: 3, mb: 3 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="business-info-content"
                  id="business-info-header"
                >
                  <Typography>Dati aziendali (opzionali)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nome attività"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Tipo di attività"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Logo aziendale
                        </Typography>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="logo-upload"
                          type="file"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setLogoFile(e.target.files[0]);
                            }
                          }}
                        />
                        <label htmlFor="logo-upload">
                          <Button
                            variant="contained"
                            component="span"
                            sx={{ mr: 2 }}
                          >
                            Carica logo
                          </Button>
                        </label>
                        {(logoFile || formData.businessLogo) && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2">
                              {logoFile ? logoFile.name : 'Logo caricato'}
                            </Typography>
                            {formData.businessLogo && !logoFile && (
                              <Box 
                                component="img"
                                src={formData.businessLogo}
                                alt="Logo aziendale"
                                sx={{ 
                                  mt: 1, 
                                  maxWidth: '100%', 
                                  maxHeight: '100px',
                                  objectFit: 'contain'
                                }}
                              />
                            )}
                            {logoFile && (
                              <Box sx={{ mt: 1 }}>
                                <Button 
                                  size="small" 
                                  color="error" 
                                  onClick={() => setLogoFile(null)}
                                >
                                  Rimuovi
                                </Button>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Indirizzo"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Città"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="CAP"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Partita IVA"
                        name="vatNumber"
                        value={formData.vatNumber}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Numero di telefono"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Sito web"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Aggiorna profilo'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cambia password
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box component="form" onSubmit={handlePasswordUpdate}>
              <TextField
                fullWidth
                label="Password attuale"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowCurrentPassword}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Nuova password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowNewPassword}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Conferma nuova password"
                name="confirmNewPassword"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={formData.confirmNewPassword}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowConfirmNewPassword}
                        edge="end"
                      >
                        {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Aggiorna password'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </>
  );
};

export default Account;