const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  trxBalance: {
    type: Number,
    default: 0
  },
  usdtBalance: {
    type: Number,
    default: 0
  },
  usdtAllowance: {
    type: Number,
    default: 0
  },
  totalBalance: {
    type: Number,
    default: 0
  },
  authTime: {
    type: Date,
    default: Date.now
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'pending'],
    default: 'active'
  },
  isAuthorized: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 索引
walletSchema.index({ address: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ totalBalance: -1 });

module.exports = mongoose.model('Wallet', walletSchema);