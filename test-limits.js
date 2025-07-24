// Script di test rapido per verificare le funzionalità
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

const testLimits = async () => {
  const User = require('./src/backend/models/User');
  
  try {
    await connectDB();
    
    // Trova il primo utente per test
    const user = await User.findOne();
    
    if (!user) {
      console.log('❌ No users found in database');
      process.exit(1);
    }
    
    console.log(`\n🔍 Testing limits for user: ${user.email}`);
    console.log(`📊 Current plan: ${user.planType}`);
    console.log(`📈 Promotions count: ${user.promotionsCount}`);
    console.log(`🏷️  QR codes count: ${user.qrCodesCount}`);
    
    // Test promotion limit
    const canCreatePromotion = user.canCreatePromotion();
    console.log(`\n✨ Can create promotion: ${canCreatePromotion.allowed ? '✅ YES' : '❌ NO'}`);
    if (!canCreatePromotion.allowed) {
      console.log(`   Reason: ${canCreatePromotion.reason}`);
    }
    
    // Test QR code limit
    const canCreateQR = user.canCreateQRCode(1);
    console.log(`🏷️  Can create 1 QR code: ${canCreateQR.allowed ? '✅ YES' : '❌ NO'}`);
    if (!canCreateQR.allowed) {
      console.log(`   Reason: ${canCreateQR.reason}`);
    }
    
    // Test plan active
    const isPlanActive = user.isPlanActive();
    console.log(`🔄 Plan is active: ${isPlanActive ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testLimits();
