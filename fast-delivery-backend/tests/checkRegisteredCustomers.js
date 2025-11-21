const mongoose = require('mongoose');
const Customer = require('../src/models/Customer');

const mongoURI = 'mongodb+srv://fastdelivery:56ynGiuw24D1T8b3@cluster0.istyclo.mongodb.net/fast_delivery';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get all registered customers
    const customers = await Customer.find();
    
    console.log(`\nTotal Registered Customers: ${customers.length}\n`);
    
    if (customers.length > 0) {
      customers.forEach((customer, index) => {
        console.log(`Customer ${index + 1}:`);
        console.log(`  ID: ${customer._id}`);
        console.log(`  Name: ${customer.name}`);
        console.log(`  Email: ${customer.email}`);
        console.log(`  Phone: ${customer.phone}`);
        console.log(`  Address: ${customer.address}`);
        console.log(`  Active: ${customer.isActive}`);
        console.log(`  Created: ${customer.createdAt}`);
        console.log('');
      });
    } else {
      console.log('No registered customers found in the database.');
    }
    
    // Check for specific emails
    console.log('Checking for specific emails:');
    const emails = ['sakis@gmail.com', 'zisoglou@gmail.com', 'zisoglou@hotmail.gr'];
    for (const email of emails) {
      const customer = await Customer.findOne({ email });
      console.log(`  ${email}: ${customer ? 'Found ✓' : 'Not found ✗'}`);
    }
    
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
