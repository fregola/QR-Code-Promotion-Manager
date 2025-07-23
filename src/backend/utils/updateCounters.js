const User = require('../models/User');
const Promotion = require('../models/Promotion');
const QRCode = require('../models/QRCode');

// Funzione per aggiornare i contatori mensili dell'utente
exports.updateMonthlyPromotionCount = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Resetta contatori se è un nuovo mese
    user.resetMonthlyCountersIfNeeded();
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const startOfMonth = new Date(currentMonth + '-01T00:00:00.000Z');
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    
    const monthlyPromotionCount = await Promotion.countDocuments({ 
      createdBy: userId,
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    const totalPromotionCount = await Promotion.countDocuments({ createdBy: userId });
    
    user.monthlyPromotionsCount = monthlyPromotionCount;
    user.totalPromotionsCount = totalPromotionCount;
    await user.save();
    
    return { monthly: monthlyPromotionCount, total: totalPromotionCount };
  } catch (error) {
    console.error('Error updating monthly promotion count:', error);
    throw error;
  }
};

// Funzione per aggiornare i contatori mensili dei QR codes
exports.updateMonthlyQRCodeCount = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Resetta contatori se è un nuovo mese
    user.resetMonthlyCountersIfNeeded();
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const startOfMonth = new Date(currentMonth + '-01T00:00:00.000Z');
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    
    // Trova tutte le promozioni dell'utente
    const promotions = await Promotion.find({ createdBy: userId });
    const promotionIds = promotions.map(p => p._id);
    
    // Conta QR codes mensili e totali
    const monthlyQRCount = await QRCode.countDocuments({ 
      promotion: { $in: promotionIds },
      createdAt: { $gte: startOfMonth, $lt: endOfMonth }
    });
    
    const totalQRCount = await QRCode.countDocuments({ promotion: { $in: promotionIds } });
    
    user.monthlyQrCodesCount = monthlyQRCount;
    user.totalQrCodesCount = totalQRCount;
    await user.save();
    
    return { monthly: monthlyQRCount, total: totalQRCount };
  } catch (error) {
    console.error('Error updating monthly QR code count:', error);
    throw error;
  }
};

// Funzione per aggiornare entrambi i contatori mensili
exports.updateAllMonthlyCounts = async (userId) => {
  try {
    const promotionCounts = await this.updateMonthlyPromotionCount(userId);
    const qrCodeCounts = await this.updateMonthlyQRCodeCount(userId);
    
    return {
      promotions: promotionCounts,
      qrCodes: qrCodeCounts
    };
  } catch (error) {
    console.error('Error updating monthly counts:', error);
    throw error;
  }
};

// Funzione per inizializzare i contatori mensili per tutti gli utenti
exports.initializeMonthlyCountsForAllUsers = async () => {
  try {
    const users = await User.find({});
    const results = [];
    
    for (const user of users) {
      const counts = await this.updateAllMonthlyCounts(user._id);
      results.push({
        userId: user._id,
        email: user.email,
        counts: counts
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error initializing monthly counts for all users:', error);
    throw error;
  }
};
