import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (searchFilter.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        user.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
        user.planType.toLowerCase().includes(searchFilter.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchFilter, users]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedUser && activeTab === 'users') {
        loadAdminData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedUser, activeTab]);

  const loadAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats', config),
        axios.get('/api/admin/users', config)
      ]);

      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setFilteredUsers(usersRes.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Admin data loading error:', error);
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`/api/admin/users/${userId}`, config);
      setSelectedUser(response.data.data);
    } catch (error) {
      console.error('Error loading user details:', error);
      alert('Errore nel caricamento dettagli utente');
    }
  };

  const changePlan = async (userId, planType) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${userId}/plan`, 
        { planType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (selectedUser && selectedUser.user._id === userId) {
        setSelectedUser({
          ...selectedUser,
          user: { ...selectedUser.user, planType }
        });
      }
      
      loadAdminData();
      alert(`Piano cambiato a ${planType}`);
    } catch (error) {
      alert('Errore nel cambio piano');
    }
  };

  const resetPassword = async (userId, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${userId}/reset-password`, 
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Password reset completato');
      
      if (selectedUser && selectedUser.user._id === userId) {
        loadUserDetails(userId);
      }
    } catch (error) {
      alert('Errore nel reset password');
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/users/${userId}/toggle-status`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (selectedUser && selectedUser.user._id === userId) {
        setSelectedUser({
          ...selectedUser,
          user: { ...selectedUser.user, isActive: !selectedUser.user.isActive }
        });
      }
      
      loadAdminData();
      alert('Status utente aggiornato');
    } catch (error) {
      alert('Errore nel cambio status');
    }
  };

  const formatActivityMessage = (log) => {
    const date = new Date(log.timestamp).toLocaleString('it-IT');
    let icon = '📋';
    
    const icons = {
      'login': '🚪',
      'logout': '👋',
      'password_change': '🔑',
      'profile_update': '👤',
      'promotion_create': '➕',
      'promotion_update': '✏️',
      'promotion_delete': '❌',
      'promotion_activate': '✅',
      'promotion_deactivate': '⏸️',
      'qrcode_create': '🏷️',
      'qrcode_scan': '📱',
      'qrcode_download': '📥',
      'qrcode_view_stats': '📊',
      'share_whatsapp': '💬',
      'share_email': '📧',
      'share_facebook': '📘',
      'share_twitter': '🐦',
      'share_linkedin': '💼',
      'share_copy_link': '🔗',
      'admin_user_plan_change': '🔧',
      'admin_user_password_reset': '🔑',
      'admin_user_status_change': '⚙️'
    };
    
    icon = icons[log.action] || '📋';
    
    return {
      icon,
      message: log.message,
      timestamp: date,
      action: log.action,
      details: log.details
    };
  };

  const getFilteredActivities = (activities) => {
    if (activityFilter === 'all') return activities.all;
    return activities.categorized[activityFilter] || [];
  };

  if (loading) {
    return <div className="admin-loading">Caricamento Dashboard Admin...</div>;
  }

  // Dettaglio utente completo
  if (selectedUser) {
    const filteredActivities = getFilteredActivities(selectedUser.activityLogs);
    
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <button 
            className="back-button"
            onClick={() => setSelectedUser(null)}
          >
            ← Torna alla lista
          </button>
          <h1>👤 Profilo Completo: {selectedUser.user.name}</h1>
          <p>Cronologia completa delle attività utente</p>
        </div>

        <div className="user-detail-container">
          <div className="user-detail-header">
            <div className="user-info-card">
              <h3>📋 Informazioni Utente</h3>
              <div className="info-grid">
                <div><strong>Nome:</strong> {selectedUser.user.name}</div>
                <div><strong>Email:</strong> {selectedUser.user.email}</div>
                <div><strong>Piano:</strong> 
                  <span className={`plan-badge ${selectedUser.user.planType}`}>
                    {selectedUser.user.planType}
                  </span>
                </div>
                <div><strong>Ruolo:</strong> {selectedUser.user.role}</div>
                <div><strong>Status:</strong> 
                  <span className={selectedUser.user.isActive !== false ? 'status-active' : 'status-inactive'}>
                    {selectedUser.user.isActive !== false ? '🟢 Attivo' : '🔴 Inattivo'}
                  </span>
                </div>
                <div><strong>Registrato:</strong> {new Date(selectedUser.user.createdAt).toLocaleDateString('it-IT')}</div>
                <div><strong>Ultimo accesso:</strong> 
                  {selectedUser.engagementMetrics.lastActivity ? 
                    new Date(selectedUser.engagementMetrics.lastActivity).toLocaleDateString('it-IT') : 
                    'Mai'
                  }
                </div>
                <div><strong>Sessioni (30gg):</strong> {selectedUser.engagementMetrics.loginFrequency}</div>
              </div>
            </div>

            <div className="user-stats-card">
              <h3>📊 Statistiche Engagement</h3>
              <div className="stats-grid-simple">
                <div>📱 {selectedUser.summary.totalPromotions} Promozioni</div>
                <div>🏷️ {selectedUser.summary.totalQRCodes} QR Codes</div>
                <div>📈 {selectedUser.summary.totalScans} Scansioni</div>
                <div>📋 {selectedUser.summary.totalActivityLogs} Azioni Totali</div>
                <div>⚡ {selectedUser.engagementMetrics.actionsLast30Days} Azioni (30gg)</div>
                <div>🔄 {selectedUser.engagementMetrics.averageSessionsPerWeek} Sessioni/settimana</div>
              </div>
            </div>
          </div>

          <div className="user-actions-panel">
            <h3>🔧 Azioni Amministratore</h3>
            <div className="action-buttons">
              <select 
                value={selectedUser.user.planType} 
                onChange={(e) => changePlan(selectedUser.user._id, e.target.value)}
                className="action-select"
              >
                <option value="free">🆓 Piano Free</option>
                <option value="pro">💎 Piano Pro</option>
                <option value="pro_test">🧪 Piano Pro Test</option>
              </select>
              
              <button 
                onClick={() => {
                  const newPassword = prompt('Nuova password (min 6 caratteri):');
                  if (newPassword && newPassword.length >= 6) {
                    resetPassword(selectedUser.user._id, newPassword);
                  }
                }}
                className="action-button password-btn"
              >
                🔑 Reset Password
              </button>
              
              <button 
                onClick={() => toggleUserStatus(selectedUser.user._id)}
                className={`action-button ${selectedUser.user.isActive !== false ? 'deactivate-btn' : 'activate-btn'}`}
              >
                {selectedUser.user.isActive !== false ? '🔴 Disattiva' : '🟢 Attiva'} Utente
              </button>
            </div>
          </div>

          <div className="user-activity-section">
            <div className="activity-header">
              <h3>📋 Cronologia Completa Attività</h3>
              <div className="activity-filters">
                <select 
                  value={activityFilter} 
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">🔍 Tutte le attività</option>
                  <option value="authentication">🚪 Autenticazione</option>
                  <option value="promotions">📱 Promozioni</option>
                  <option value="qrcodes">🏷️ QR Codes</option>
                  <option value="sharing">📤 Condivisioni</option>
                  <option value="admin_actions">🔧 Azioni Admin</option>
                </select>
              </div>
            </div>
            
            <div className="activity-timeline">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((log, index) => {
                  const formatted = formatActivityMessage(log);
                  return (
                    <div key={index} className="timeline-item">
                      <div className="timeline-icon">{formatted.icon}</div>
                      <div className="timeline-content">
                        <div className="timeline-date">{formatted.timestamp}</div>
                        <div className="timeline-message">{formatted.message}</div>
                        {log.details.metadata && (
                          <div className="timeline-metadata">
                            {log.details.metadata.ip && <span>📍 IP: {log.details.metadata.ip}</span>}
                            {log.details.metadata.browser && <span>🌐 Browser: {log.details.metadata.browser}</span>}
                            {log.details.metadata.device && <span>📱 Device: {log.details.metadata.device}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>Nessuna attività trovata per il filtro selezionato</p>
              )}
            </div>
          </div>

          <div className="user-promotions-section">
            <h3>📱 Promozioni Utente</h3>
            <div className="promotions-list">
              {selectedUser.promotions.map(promotion => (
                <div key={promotion._id} className="promotion-card">
                  <h4>{promotion.name}</h4>
                  <p>{promotion.description}</p>
                  <div className="promotion-stats">
                    <span>🏷️ {promotion.qrCodesCount} QR Codes</span>
                    <span className={promotion.isActive ? 'status-active' : 'status-inactive'}>
                      {promotion.isActive ? '✅ Attiva' : '❌ Inattiva'}
                    </span>
                    <span>📅 {new Date(promotion.createdAt).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard principale (solo Overview e Gestione Utenti)
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🔧 Dashboard Super Admin</h1>
        <p>Controllo completo del sistema QR Code Promotion Manager</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Gestione Utenti
        </button>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>👥 Utenti</h3>
              <div className="stat-number">{stats.overview.users.total}</div>
              <div className="stat-details">
                <span>🟢 Attivi: {stats.overview.users.active}</span>
                <span>🆓 Free: {stats.overview.users.free}</span>
                <span>💎 Pro: {stats.overview.users.pro}</span>
                <span>🧪 Test: {stats.overview.users.test}</span>
              </div>
            </div>

            <div className="stat-card">
              <h3>📱 Promozioni</h3>
              <div className="stat-number">{stats.overview.promotions.total}</div>
              <div className="stat-details">
                <span>✅ Attive: {stats.overview.promotions.active}</span>
                <span>📅 Questo mese: {stats.overview.promotions.thisMonth}</span>
              </div>
            </div>

            <div className="stat-card">
              <h3>🏷️ QR Codes</h3>
              <div className="stat-number">{stats.overview.qrCodes.total}</div>
              <div className="stat-details">
                <span>✅ Utilizzati: {stats.overview.qrCodes.used}</span>
                <span>⏳ Non utilizzati: {stats.overview.qrCodes.unused}</span>
              </div>
            </div>

            <div className="stat-card">
              <h3>📈 Scansioni</h3>
              <div className="stat-number">{stats.overview.scans.total}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-section">
          <div className="users-header">
            <h3>👥 Gestione Utenti</h3>
            <div className="search-filter">
              <input
                type="text"
                placeholder="🔍 Cerca per nome, email o piano..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>👤 Nome</th>
                  <th>📧 Email</th>
                  <th>📋 Piano</th>
                  <th>📊 Statistiche</th>
                  <th>🕒 Ultima Attività</th>
                  <th>⚙️ Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id} className="user-row">
                    <td>
                      <strong>{user.name}</strong>
                      {user.role === 'super_admin' && <span className="admin-badge">⭐</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`plan-badge ${user.planType}`}>
                        {user.planType === 'free' ? '🆓' : user.planType === 'pro' ? '💎' : '🧪'} 
                        {user.planType}
                      </span>
                    </td>
                    <td className="stats-cell">
                      <div>📱 {user.stats.totalPromotions} | 🏷️ {user.stats.totalQRCodes} | 📈 {user.stats.totalScans}</div>
                    </td>
                    <td>
                      {user.stats.lastActivityDate ? 
                        new Date(user.stats.lastActivityDate).toLocaleDateString('it-IT') : 
                        'Mai attivo'
                      }
                    </td>
                    <td>
                      <button 
                        onClick={() => loadUserDetails(user._id)}
                        className="view-details-btn"
                      >
                        👁️ Profilo Completo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;