  // 启动监控
  async startMonitor(req, res) {
    try {
      const MonitorService = require('../services/MonitorService');
      await MonitorService.startMonitoring();
      res.json({ message: '监控服务已启动' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 停止监控
  async stopMonitor(req, res) {
    try {
      const MonitorService = require('../services/MonitorService');
      MonitorService.stopMonitoring();
      res.json({ message: '监控服务已停止' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 手动归集所有
  async manualCollectAll(req, res) {
    try {
      const MonitorService = require('../services/MonitorService');
      
      const wallets = await Wallet.find({ 
        status: 'active', 
        isAuthorized: true,
        usdtBalance: { $gt: 0 } 
      });

      const results = [];
      for (const wallet of wallets) {
        try {
          const transaction = await MonitorService.collectWalletFunds(wallet, 'manual');
          results.push({
            wallet: wallet.address,
            status: 'success',
            transaction: transaction._id,
            amount: wallet.usdtBalance
          });
        } catch (error) {
          results.push({
            wallet: wallet.address,
            status: 'failed',
            error: error.message
          });
        }
      }

      res.json({ 
        message: '手动归集完成',
        results 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 合约手动划转
  async manualTransferContract(req, res) {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: '无效的金额' });
      }

      const MonitorService = require('../services/MonitorService');
      const transaction = await MonitorService.transferContractFunds(amount);

      res.json({ 
        message: '合约划转完成',
        transaction 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }