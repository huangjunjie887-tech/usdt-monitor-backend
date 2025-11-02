const Transaction = require('../models/Transaction');

class TransactionController {
  // 获取所有交易记录
  async getTransactions(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        status
      } = req.query;
      
      const query = {};
      if (type) query.type = type;
      if (status) query.status = status;

      const transactions = await Transaction.find(query)
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Transaction.countDocuments(query);

      // 获取交易统计
      const stats = await this.getTransactionStats();

      res.json({
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
        stats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取交易统计
  async getTransactionStats() {
    const totalCollected = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const successCount = await Transaction.countDocuments({ status: 'completed' });
    const failedCount = await Transaction.countDocuments({ status: 'failed' });

    return {
      totalCollected: totalCollected[0]?.total || 0,
      successCount,
      failedCount
    };
  }

  // 清空交易记录
  async clearTransactions(req, res) {
    try {
      await Transaction.deleteMany({});
      res.json({ message: '交易记录已清空' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TransactionController();