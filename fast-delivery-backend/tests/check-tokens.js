require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Customer = require('../src/models/Customer');
  const Driver = require('../src/models/Driver');
  
  console.log('\n=== CUSTOMERS WITH PUSH TOKENS ===');
  const customers = await Customer.find({ pushToken: { $ne: null } }).select('name phone pushToken');
  console.log('Total:', customers.length);
  customers.forEach(c => console.log(`  ${c.name} (${c.phone}): ${c.pushToken}`));
  
  console.log('\n=== DRIVERS WITH PUSH TOKENS ===');
  const drivers = await Driver.find({ pushToken: { $ne: null } }).select('name email pushToken');
  console.log('Total:', drivers.length);
  drivers.forEach(d => console.log(`  ${d.name} (${d.email}): ${d.pushToken}`));
  
  mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
