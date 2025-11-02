const MonitorService = require('../services/MonitorService');

// 更新collectWallet方法
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
    const transaction = await MonitorService.collectWalletFunds(wallet, 'manual');

    res.json({ 
      message: '归集交易已发送', 
      transaction 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}