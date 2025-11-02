const User = require('../models/User');

async function initializeDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 检查是否已有管理员用户
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      // 创建默认管理员用户
      const adminUser = new User({
        username: 'admin',
        password: 'admin123', // 会被bcrypt自动加密
        name: '系统管理员',
        role: 'super_admin'
      });
      
      await adminUser.save();
      console.log('默认管理员用户创建成功: admin / admin123');
    } else {
      console.log('管理员用户已存在');
    }
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

module.exports = initializeDatabase;