const TronWeb = require('tronweb');

class TronService {
  constructor() {
    this.tronWeb = new TronWeb({
      fullHost: process.env.TRON_NETWORK === 'mainnet' 
        ? 'https://api.trongrid.io'
        : 'https://api.shasta.trongrid.io',
      headers: { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY },
      privateKey: process.env.CREATOR_PRIVATE_KEY
    });

    this.USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  }

  // 获取钱包余额
  async getWalletBalance(address) {
    try {
      const balance = await this.tronWeb.trx.getBalance(address);
      const usdtBalance = await this.getTokenBalance(address, this.USDT_CONTRACT);
      
      return {
        trxBalance: this.tronWeb.fromSun(balance),
        usdtBalance: usdtBalance / 1000000, // USDT有6位小数
        address: address
      };
    } catch (error) {
      console.error(`获取钱包余额失败 ${address}:`, error);
      return {
        trxBalance: 0,
        usdtBalance: 0,
        address: address
      };
    }
  }

  // 获取代币余额
  async getTokenBalance(address, contractAddress) {
    try {
      const contract = await this.tronWeb.contract().at(contractAddress);
      const balance = await contract.balanceOf(address).call();
      return balance.toNumber();
    } catch (error) {
      console.error(`获取代币余额失败 ${address}:`, error);
      return 0;
    }
  }

  // 获取授权额度
  async getAllowance(owner, spender) {
    try {
      const contract = await this.tronWeb.contract().at(this.USDT_CONTRACT);
      const allowance = await contract.allowance(owner, spender).call();
      return allowance.toNumber() / 1000000;
    } catch (error) {
      console.error(`获取授权额度失败 ${owner}:`, error);
      return 0;
    }
  }

  // 获取账户资源
  async getAccountResources(address) {
    try {
      const account = await this.tronWeb.trx.getAccountResources(address);
      return account;
    } catch (error) {
      console.error(`获取账户资源失败 ${address}:`, error);
      return { EnergyLimit: 0, freeNetLimit: 0 };
    }
  }

  // 验证地址格式
  isValidAddress(address) {
    return this.tronWeb.isAddress(address);
  }
}

module.exports = new TronService();