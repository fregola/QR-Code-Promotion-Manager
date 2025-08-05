import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  QrCode as QrCodeIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import axios from 'axios';

const QRCodesList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPromotionId = queryParams.get('promotionId');

  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(initialPromotionId || '');

  useEffect(() => {
    // Fetch promotions for the filter dropdown
    const fetchPromotions = async () => {
      try {
        const res = await axios.get('/api/promotions?limit=100');
        setPromotions(res.data.data);
      } catch (err) {
        console.error('Error fetching promotions:', err);
      }
    };

    fetchPromotions();
  }, []);

  useEffect(() => {
    const fetchQRCodes = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/api/qrcodes?page=${page + 1}&limit=${rowsPerPage}`;
        
        if (searchTerm) {
          url += `&search=${searchTerm}`;
        }
        
        if (selectedPromotion) {
          url += `&promotion=${selectedPromotion}`;
        }

        const res = await axios.get(url);
        setQrCodes(res.data.data);
        setTotalCount(res.data.pagination.total);
      } catch (err) {
        setError(err.response?.data?.error || 'Errore durante il recupero dei QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCodes();
  }, [page, rowsPerPage, searchTerm, selectedPromotion]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
  };

  const handlePromotionChange = (e) => {
    setSelectedPromotion(e.target.value);
    setPage(0);
  };

  const handleViewQRCode = (id) => {
    navigate(`/qrcodes/${id}`);
  };

  const handleVerifyQRCode = (code) => {
    navigate(`/qrcode/verify/${code}`);
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        QR Codes
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ flex: 1 }}>
            <TextField
              fullWidth
              label="Cerca per codice"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit" edge="end">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="promotion-filter-label">Filtra per promozione</InputLabel>
            <Select
              labelId="promotion-filter-label"
              value={selectedPromotion}
              onChange={handlePromotionChange}
              label="Filtra per promozione"
            >
              <MenuItem value="">Tutte le promozioni</MenuItem>
              {promotions.map((promotion) => (
                <MenuItem key={promotion._id} value={promotion._id}>
                  {promotion.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && qrCodes.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Nessun QR code trovato. Prova a modificare i filtri di ricerca.
          </Alert>
        )}

        {!loading && !error && qrCodes.length > 0 && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Codice</TableCell>
                    <TableCell>Promozione</TableCell>
                    <TableCell>Utilizzi</TableCell>
                    <TableCell>Stato</TableCell>
                    <TableCell align="center" >Condiviso</TableCell>
                    <TableCell>Creato il</TableCell>
                    <TableCell>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qrCodes.map((qrCode) => (
                    <TableRow key={qrCode._id}>
                      <TableCell>{qrCode.code}</TableCell>
                      <TableCell>{qrCode.promotion.name}</TableCell>
                      <TableCell>
                        {qrCode.usageCount} / {qrCode.maxUsageCount}
                      </TableCell>
                      <TableCell>
                        {qrCode.usageCount >= qrCode.maxUsageCount ? (
                          <Chip
                            icon={<CancelIcon />}
                            label="Esaurito"
                            color="error"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Disponibile"
                            color="success"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {qrCode.totalShares > 0 ? (
                          <ShareIcon sx={{ color: 'success.main' }} />
                        ) : (
                          <ShareIcon sx={{ color: 'error.main' }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(qrCode.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="primary"
                            onClick={() => handleViewQRCode(qrCode._id)}
                            title="Visualizza dettagli"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => handleVerifyQRCode(qrCode.code)}
                            title="Verifica QR Code"
                          >
                            <QrCodeIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Righe per pagina:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} di ${count !== -1 ? count : `più di ${to}`}`
              }
            />
          </>
        )}
      </Paper>
    </>
  );
};

export default QRCodesList;
