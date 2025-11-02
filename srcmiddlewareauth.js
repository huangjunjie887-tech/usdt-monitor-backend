const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '访问被拒绝，没有提供token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Token无效' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token无效' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    next();
  } catch (error) {
    res.status(403).json({ error: '权限不足' });
  }
};

module.exports = { auth, adminAuth };