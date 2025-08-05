import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
  InputAdornment,
  Pagination,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  VpnKey as PasswordIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import UserDetailModal from './UserDetailModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Stato per ricerca e filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'user',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, statusFilter, sortBy, sortOrder, currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('isActive', statusFilter);

      const response = await fetch(`/api/admin/users/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.totalUsers);
      } else {
        setError('Errore nel caricamento utenti');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleViewDetails = () => {
    setSelectedUserId(selectedUser._id);
    setDetailModalOpen(true);
    handleMenuClose();
  };

  const handleEditUser = () => {
    setEditForm({
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      isActive: selectedUser.isActive
    });
    setEditDialog(true);
    handleMenuClose();
  };

  const handleToggleUserStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser._id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess(`Utente ${selectedUser.isActive ? 'disabilitato' : 'abilitato'} con successo`);
        fetchUsers();
      } else {
        setError('Errore nell\'aggiornamento dello stato utente');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
    handleMenuClose();
  };

  const handleResetPassword = async () => {
    if (!window.confirm(`Sei sicuro di voler resettare la password di ${selectedUser.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Password resettata per ${selectedUser.name}. Nuova password: ${data.tempPassword}`);
      } else {
        setError('Errore nel reset della password');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
    handleMenuClose();
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(`Sei sicuro di voler eliminare completamente l'utente "${selectedUser.name}"? Questa azione è irreversibile!`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Utente eliminato con successo');
        fetchUsers();
      } else {
        setError('Errore nell\'eliminazione utente');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
    handleMenuClose();
  };

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setSuccess('Utente aggiornato con successo');
        setEditDialog(false);
        fetchUsers();
      } else {
        setError('Errore nell\'aggiornamento utente');
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset alla prima pagina quando si cerca
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'role':
        setRoleFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'sortBy':
        setSortBy(value);
        break;
      case 'sortOrder':
        setSortOrder(value);
        break;
    }
    setCurrentPage(1);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'error' : 'primary';
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestione Utenti
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Visualizza e gestisci tutti gli utenti del sistema ({totalUsers} utenti totali)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Controlli di ricerca e filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Cerca per nome o email..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Ruolo</InputLabel>
                <Select
                  value={roleFilter}
                  label="Ruolo"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="user">Utente</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Stato</InputLabel>
                <Select
                  value={statusFilter}
                  label="Stato"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="true">Attivi</MenuItem>
                  <MenuItem value="false">Inattivi</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordina per</InputLabel>
                <Select
                  value={sortBy}
                  label="Ordina per"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="createdAt">Data Registrazione</MenuItem>
                  <MenuItem value="name">Nome</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="lastLogin">Ultimo Accesso</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordine</InputLabel>
                <Select
                  value={sortOrder}
                  label="Ordine"
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <MenuItem value="desc">Decrescente</MenuItem>
                  <MenuItem value="asc">Crescente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabella utenti */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Ruolo</TableCell>
                      <TableCell>Stato</TableCell>
                      <TableCell>Data Registrazione</TableCell>
                      <TableCell>Ultimo Accesso</TableCell>
                      <TableCell align="center">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {user.role === 'admin' ? 
                              <AdminIcon sx={{ mr: 1, color: 'error.main' }} /> : 
                              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                            }
                            {user.name}
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.isActive ? 'Attivo' : 'Disabilitato'} 
                            color={getStatusColor(user.isActive)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Mai'}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Azioni">
                            <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {users.length === 0 && !loading && (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary">
                    Nessun utente trovato con i filtri selezionati
                  </Typography>
                </Box>
              )}

              {/* Paginazione */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Menu azioni */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon sx={{ mr: 1 }} />
          Visualizza Dettagli
        </MenuItem>
        <MenuItem onClick={handleEditUser}>
          <EditIcon sx={{ mr: 1 }} />
          Modifica
        </MenuItem>
        <MenuItem onClick={handleResetPassword}>
          <PasswordIcon sx={{ mr: 1 }} />
          Reset Password
        </MenuItem>
        <MenuItem onClick={handleToggleUserStatus}>
          {selectedUser?.isActive ? (
            <>
              <BlockIcon sx={{ mr: 1 }} />
              Disabilita
            </>
          ) : (
            <>
              <CheckCircleIcon sx={{ mr: 1 }} />
              Abilita
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Elimina
        </MenuItem>
      </Menu>

      {/* Dialog modifica utente */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifica Utente</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nome"
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              value={editForm.email}
              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Ruolo</InputLabel>
              <Select
                value={editForm.role}
                label="Ruolo"
                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
              >
                <MenuItem value="user">Utente</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                />
              }
              label="Utente Attivo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Annulla</Button>
          <Button onClick={handleSaveUser} variant="contained">Salva</Button>
        </DialogActions>
      </Dialog>

      {/* Modal dettagli utente */}
      <UserDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        userId={selectedUserId}
        onUserUpdated={fetchUsers}
      />
    </Box>
  );
};

export default UserManagement;
