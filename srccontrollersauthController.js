const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  // 用户登录
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // 检查用户是否存在
      const user = await User.findOne({ username, isActive: true });
      if (!user || !(await user.correctPassword(password, user.password))) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      // 更新最后登录时间
      user.lastLogin = new Date();
      await user.save();

      // 生成token
      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取当前用户信息
  async getMe(req, res) {
    try {
      res.json({
        user: {
          id: req.user._id,
          username: req.user.username,
          name: req.user.name,
          role: req.user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();