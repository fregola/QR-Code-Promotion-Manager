import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControlLabel,
  Checkbox,
  FormControl,
  FormGroup,
  Divider,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  ExpandMore as ExpandMoreIcon,
  Security,
  Policy,
  Cookie
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Campi aziendali opzionali
    businessName: '',
    businessType: '',
    address: '',
    city: '',
    postalCode: '',
    vatNumber: '',
    phoneNumber: '',
    website: '',
    // NUOVI CAMPI LEGALI
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedCookies: false,
    acceptedMarketing: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate(`/check-email?email=${encodeURIComponent(formData.email)}`);
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name) {
      errors.name = 'Nome è obbligatorio';
    }

    if (!formData.email) {
      errors.email = 'Email è obbligatoria';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Email non valida';
    }

    if (!formData.password) {
      errors.password = 'Password è obbligatoria';
    } else if (formData.password.length < 6) {
      errors.password = 'La password deve essere di almeno 6 caratteri';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Le password non corrispondono';
    }

    // VALIDAZIONE CONSENSI LEGALI OBBLIGATORI
    if (!formData.acceptedTerms) {
      errors.acceptedTerms = 'Devi accettare i Termini e Condizioni per procedere';
    }

    if (!formData.acceptedPrivacy) {
      errors.acceptedPrivacy = 'Devi accettare la Privacy Policy per procedere';
    }

    if (!formData.acceptedCookies) {
      errors.acceptedCookies = 'Devi accettare la Cookie Policy per procedere';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    // Clear field error when typing/clicking
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
    // Clear global error when typing
    if (error) {
      clearError();
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const { 
        name, 
        email, 
        password, 
        businessName, 
        businessType, 
        address, 
        city, 
        postalCode, 
        vatNumber, 
        phoneNumber, 
        website,
        acceptedTerms,
        acceptedPrivacy,
        acceptedCookies,
        acceptedMarketing
      } = formData;
      
      // Includi i campi aziendali opzionali e consensi legali nella registrazione
      const success = await register({ 
        name, 
        email, 
        password,
        businessName, 
        businessType, 
        address, 
        city, 
        postalCode, 
        vatNumber, 
        phoneNumber, 
        website,
        acceptedTerms,
        acceptedPrivacy,
        acceptedCookies,
        acceptedMarketing
      });
      
      if (success) {
        // Registrazione riuscita - vai alla pagina controllo email
        navigate(`/check-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        // Anche se fallisce, mostra la pagina email (l'utente potrebbe essere stato creato)
        navigate(`/check-email?email=${encodeURIComponent(formData.email)}`);
      }
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Registrati
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error === 'Email già in uso' ? 
                'Questa email è già registrata. Prova con un\'altra email o accedi al tuo account esistente.' : 
                error}
            </Alert>
          )}
          {!error && (
            <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
              Compila tutti i campi obbligatori e accetta i consensi legali per completare la registrazione.
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Nome"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {!formErrors.password && (
              <FormHelperText>
                La password deve essere di almeno 6 caratteri
              </FormHelperText>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Conferma Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* SEZIONE CONSENSI LEGALI OBBLIGATORI */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1 }} />
                Consensi Legali Obbligatori
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControl component="fieldset" fullWidth error={!!formErrors.acceptedTerms || !!formErrors.acceptedPrivacy || !!formErrors.acceptedCookies}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.acceptedTerms}
                        onChange={handleChange}
                        name="acceptedTerms"
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        * Accetto i{' '}
                        <Link component={RouterLink} to="/terms" target="_blank" rel="noopener">
                          Termini e Condizioni
                        </Link>
                      </Typography>
                    }
                  />
                  {formErrors.acceptedTerms && (
                    <FormHelperText error>{formErrors.acceptedTerms}</FormHelperText>
                  )}

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.acceptedPrivacy}
                        onChange={handleChange}
                        name="acceptedPrivacy"
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        * Accetto la{' '}
                        <Link component={RouterLink} to="/privacy" target="_blank" rel="noopener">
                          Privacy Policy
                        </Link>
                      </Typography>
                    }
                  />
                  {formErrors.acceptedPrivacy && (
                    <FormHelperText error>{formErrors.acceptedPrivacy}</FormHelperText>
                  )}

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.acceptedCookies}
                        onChange={handleChange}
                        name="acceptedCookies"
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        * Accetto la{' '}
                        <Link component={RouterLink} to="/cookies" target="_blank" rel="noopener">
                          Cookie Policy
                        </Link>
                      </Typography>
                    }
                  />
                  {formErrors.acceptedCookies && (
                    <FormHelperText error>{formErrors.acceptedCookies}</FormHelperText>
                  )}

                  <Box sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.acceptedMarketing}
                          onChange={handleChange}
                          name="acceptedMarketing"
                          color="secondary"
                        />
                      }
                      label={
                        <Typography variant="body2" color="text.secondary">
                          Acconsento a ricevere comunicazioni promozionali e newsletter (opzionale)
                        </Typography>
                      }
                    />
                  </Box>
                </FormGroup>
              </FormControl>
            </Box>

            <Accordion sx={{ mt: 2, mb: 2, width: '100%' }}>
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
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tipo di attività"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      placeholder="Es. Bar, Lavaggio auto, Centro estetico"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Indirizzo"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Città"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="CAP"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Partita IVA"
                      name="vatNumber"
                      value={formData.vatNumber}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Numero di telefono"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Sito web"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 2 }}
              size="large"
            >
              Registrati
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Hai già un account? Accedi
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
