const express = require('express');
const router = express.Router();

// 控制器
const authController = require('../controllers/authController');
const walletController = require('../controllers/walletController');
const transactionController = require('../controllers/transactionController');
const systemController = require('../controllers/systemController');

// 中间件
const { auth, adminAuth } = require('../middleware/auth');

// 认证路由
router.post('/auth/login', authController.login);
router.get('/auth/me', auth, authController.getMe);

// 钱包路由
router.get('/wallets', auth, walletController.getWallets);
router.post('/wallets', adminAuth, walletController.addWallet);
router.get('/wallets/stats', auth, walletController.getWalletStats);
router.put('/wallets/:id', adminAuth, walletController.updateWallet);
router.delete('/wallets/:id', adminAuth, walletController.deleteWallet);
router.post('/wallets/:id/refresh', adminAuth, walletController.refreshWallet);
router.post('/wallets/:id/collect', adminAuth, walletController.collectWallet);

// 交易路由
router.get('/transactions', auth, transactionController.getTransactions);
router.delete('/transactions', adminAuth, transactionController.clearTransactions);

// 系统路由
router.get('/system/status', auth, systemController.getSystemStatus);
router.get('/system/creator-status', auth, systemController.refreshCreatorStatus);
router.put('/system/config', adminAuth, systemController.updateSystemConfig);
router.post('/system/monitor/start', adminAuth, systemController.startMonitor);
router.post('/system/monitor/stop', adminAuth, systemController.stopMonitor);
router.post('/system/collect-all', adminAuth, systemController.manualCollectAll);

module.exports = router;