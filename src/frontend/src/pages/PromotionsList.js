import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from 'axios';

const PromotionsList = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await axios.get(`/api/promotions?page=${page + 1}&limit=${rowsPerPage}`);
        setPromotions(res.data.data);
        setFilteredPromotions(res.data.data);
        setTotalCount(res.data.pagination.total);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Errore nel caricamento delle promozioni');
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPromotions(promotions);
    } else {
      const filtered = promotions.filter(promotion =>
        promotion.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPromotions(filtered);
    }
  }, [searchTerm, promotions]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa promozione?')) {
      try {
        await axios.delete(`/api/promotions/${id}`);
        // Refresh the list
        const res = await axios.get(`/api/promotions?page=${page + 1}&limit=${rowsPerPage}`);
        setPromotions(res.data.data);
        setFilteredPromotions(res.data.data);
        setTotalCount(res.data.pagination.total);
      } catch (err) {
        setError(err.response?.data?.error || 'Errore durante l\'eliminazione della promozione');
      }
    }
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
          Promozioni
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

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Cerca promozioni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Data Creazione</TableCell>
                <TableCell>Data Scadenza</TableCell>
                <TableCell>QR Code</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPromotions.length > 0 ? (
                filteredPromotions.map((promotion) => (
                  <TableRow key={promotion._id}>
                    <TableCell>{promotion.name}</TableCell>
                    <TableCell>
                      {new Date(promotion.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {promotion.expiryDate
                        ? new Date(promotion.expiryDate).toLocaleDateString()
                        : 'Nessuna scadenza'}
                    </TableCell>
                    <TableCell>{promotion.qrCodesCount}</TableCell>
                    <TableCell>
                      <Chip
                        label={promotion.isActive ? 'Attiva' : 'Da utilizzare'}
                        color={promotion.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/promotions/${promotion._id}`)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => navigate(`/promotions/${promotion._id}`, { state: { edit: true } })}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(promotion._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nessuna promozione trovata
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
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
      </Paper>
    </>
  );
};

export default PromotionsList;