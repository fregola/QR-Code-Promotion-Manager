const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role isActive createdAt lastLogin')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('name email role isActive createdAt lastLogin')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    console.log('=== TOGGLE USER STATUS ===');
    console.log('User ID:', req.params.id);
    
    const user = await User.findById(req.params.id);
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    console.log('📋 User before:', {
      name: user.name,
      email: user.email,
      isActive: user.isActive
    });

    user.isActive = !user.isActive;
    
    console.log('📋 User after toggle:', {
      name: user.name,
      email: user.email,
      isActive: user.isActive
    });

    const savedUser = await user.save();
    console.log('💾 User saved:', {
      name: savedUser.name,
      email: savedUser.email,
      isActive: savedUser.isActive
    });

    res.json({ 
      message: `Utente ${user.isActive ? 'abilitato' : 'disabilitato'} con successo`,
      user: {
        _id: user._id,
        name: user.name,
        isActive: user.isActive
      }
    });
    
    console.log('✅ Response sent');
  } catch (error) {
    console.error('💥 Error in toggleUserStatus:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const activities = [];
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt');
    
    recentUsers.forEach(user => {
      activities.push({
        type: 'user',
        description: `Nuovo utente registrato: ${user.name}`,
        createdAt: user.createdAt
      });
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    const tempPassword = Math.random().toString(36).slice(-8) + '123';
    user.password = tempPassword;
    await user.save();

    res.json({ 
      message: `Password resettata per ${user.name}`,
      tempPassword: tempPassword
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    res.json({
      user,
      promotions: [],
      qrcodes: [],
      stats: { totalPromotions: 0, totalQRCodes: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    // Non permettere di eliminare se stesso
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Non puoi eliminare il tuo account admin' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: `Utente ${user.name} eliminato con successo` });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers, totalPromotions: 0, totalQRCodes: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const tempPassword = '123456';
    res.json({ message: 'Password resettata', tempPassword });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({ user, promotions: [], qrcodes: [] });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utente eliminato' });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server' });
  }
};
