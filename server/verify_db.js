require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function verify() {
    console.log('--- Verification Start ---');

    // 1. Check .env file
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        console.log('✅ .env file exists.');
        const envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('MONGO_URI')) {
            console.log('✅ MONGO_URI found in .env');
        } else {
            console.log('❌ MONGO_URI NOT found in .env');
        }
        if (envContent.includes('JWT_SECRET')) {
            console.log('✅ JWT_SECRET found in .env');
        } else {
            console.log('❌ JWT_SECRET NOT found in .env');
        }
    } else {
        console.log('❌ .env file does NOT exist.');
    }

    // 2. Check Database Connection
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/syncflow';
    console.log(`Connecting to MongoDB at: ${uri}`);

    try {
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connection Successful!');
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
    }
    console.log('--- Verification End ---');
}

verify();
