  // 更新钱包
  async updateWallet(req, res) {
    try {
      const { id } = req.params;
      const { name, status } = req.body;

      const wallet = await Wallet.findByIdAndUpdate(
        id,
        { name, status },
        { new: true }
      );

      if (!wallet) {
        return res.status(404).json({ error: '钱包未找到' });
      }

      res.json(wallet);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 刷新钱包余额
  async refreshWallet(req, res) {
    try {
      const { id } = req.params;

      const wallet = await Wallet.findById(id);
      if (!wallet) {
        return res.status(404).json({ error: '钱包未找到' });
      }

      const balanceInfo = await TronService.getWalletBalance(wallet.address);
      const allowance = await TronService.getAllowance(wallet.address, process.env.CONTRACT_ADDRESS);

      wallet.trxBalance = balanceInfo.trxBalance;
      wallet.usdtBalance = balanceInfo.usdtBalance;
      wallet.usdtAllowance = allowance;
      wallet.totalBalance = balanceInfo.usdtBalance;
      wallet.lastChecked = new Date();

      await wallet.save();

      res.json(wallet);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 手动归集钱包
  async collectWallet(req, res) {
    try {
      const { id } = req.params;

      const wallet = await Wallet.findById(id);
      if (!wallet) {
        return res.status(404).json({ error: '钱包未找到' });
      }

      if (wallet.usdtBalance <= 0) {
        return res.status(400).json({ error: '钱包余额为0' });
      }

      // 使用真实归集服务
      const MonitorService = require('../services/MonitorService');
      const transaction = await MonitorService.collectWalletFunds(wallet, 'manual');

      res.json({ 
        message: '归集交易已发送', 
        transaction 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }