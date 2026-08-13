const jwt = require('jsonwebtoken');
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOne({ phone: '9964496644' });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_key_isiri_properties_2026',
    { expiresIn: '7d' }
  );

  try {
    const res = await axios.put('http://localhost:5000/api/auth/update-profile', {
      name: 'Ninu',
      phone: '9964496644',
      city: ''
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('API Success:', res.data);
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err.message);
  }
  process.exit(0);
});
