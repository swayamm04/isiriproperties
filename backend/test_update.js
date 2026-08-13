const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const user = await User.findOne({ phone: '9964496644' });
    if (user) {
      user.name = 'Ninu';
      user.phone = '9964496644';
      user.city = '';
      await user.save();
      console.log('Success');
    } else {
      console.log('User not found');
    }
  } catch(e) {
    console.error('Save error:', e);
  }
  process.exit(0);
});
