const TronService = require('../services/TronService');

class SystemController {
  // 获取系统状态
  async getSystemStatus(req, res) {
    try {
      const [creatorStatus, config] = await Promise.all([
        this.getCreatorStatus(),
        this.getSystemConfig()
      ]);

      res.json({
        config,
        creatorStatus,
        serverTime: new Date(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取创建者状态
  async getCreatorStatus() {
    try {
      const balance = await TronService.getWalletBalance(process.env.CREATOR_ADDRESS);
      const resources = await TronService.getAccountResources(process.env.CREATOR_ADDRESS);
      
      const energyPerTransfer = 30000;
      const estimatedTransfers = Math.floor((resources.EnergyLimit || 0) / energyPerTransfer);

      return {
        address: process.env.CREATOR_ADDRESS,
        trxBalance: balance.trxBalance,
        energy: resources.EnergyLimit || 0,
        bandwidth: resources.freeNetLimit || 0,
        estimatedTransfers,
        energyPerTransfer
      };
    } catch (error) {
      console.error('获取创建者状态失败:', error);
      return {
        address: process.env.CREATOR_ADDRESS,
        trxBalance: 0,
        energy: 0,
        bandwidth: 0,
        estimatedTransfers: 0,
        energyPerTransfer: 30000
      };
    }
  }

  // 获取系统配置
  async getSystemConfig() {
    return {
      contractAddress: process.env.CONTRACT_ADDRESS,
      targetAddress: process.env.TARGET_ADDRESS,
      creatorAddress: process.env.CREATOR_ADDRESS,
      collectThreshold: process.env.COLLECT_THRESHOLD,
      contractThreshold: process.env.CONTRACT_THRESHOLD,
      smallTotalThreshold: process.env.SMALL_TOTAL_THRESHOLD,
      scanInterval: process.env.SCAN_INTERVAL
    };
  }

  // 刷新创建者状态
  async refreshCreatorStatus(req, res) {
    try {
      const creatorStatus = await this.getCreatorStatus();
      res.json(creatorStatus);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 更新系统配置
  async updateSystemConfig(req, res) {
    try {
      const {
        contractAddress,
        targetAddress,
        collectThreshold,
        contractThreshold,
        smallTotalThreshold,
        scanInterval
      } = req.body;

      // 这里应该保存到数据库，暂时先更新环境变量
      if (contractAddress) process.env.CONTRACT_ADDRESS = contractAddress;
      if (targetAddress) process.env.TARGET_ADDRESS = targetAddress;
      if (collectThreshold) process.env.COLLECT_THRESHOLD = collectThreshold;
      if (contractThreshold) process.env.CONTRACT_THRESHOLD = contractThreshold;
      if (smallTotalThreshold) process.env.SMALL_TOTAL_THRESHOLD = smallTotalThreshold;
      if (scanInterval) process.env.SCAN_INTERVAL = scanInterval;

      res.json({ message: '系统配置已更新' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SystemController();