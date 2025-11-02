const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true
  },
  fromAddress: String,
  toAddress: String,
  amount: {
    type: Number,
    required: true
  },
  txHash: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['auto', 'manual', 'contract_transfer'],
    required: true
  },
  gasUsed: Number,
  failureReason: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ walletAddress: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);