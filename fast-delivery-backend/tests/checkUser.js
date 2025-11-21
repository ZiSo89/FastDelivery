const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Customer = require('../src/models/Customer');

const checkUser = async () => {
  console.log('Starting script...');
  console.log('URI:', process.env.MONGODB_URI ? 'Defined' : 'Undefined');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = "takis@hotmail.gr";
    const customer = await Customer.findOne({ email });

    if (customer) {
      console.log('Found customer:', customer);
    } else {
      console.log('Customer not found with email:', email);
    }

    // Also check if there are any other documents with this email in the raw collection
    // in case of Mongoose model mismatch
    const collection = mongoose.connection.collection('customers');
    const rawDoc = await collection.findOne({ email });
    
    if (rawDoc) {
        console.log('Found raw document in customers collection:', rawDoc);
    } else {
        console.log('No raw document found in customers collection either.');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUser();
