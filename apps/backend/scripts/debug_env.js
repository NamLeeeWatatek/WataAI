const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
console.log('Checking .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('.env file FOUND');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    if (envConfig.ENCRYPTION_KEY) {
        console.log('ENCRYPTION_KEY found in .env');
        console.log('Key length:', envConfig.ENCRYPTION_KEY.length);
        console.log('First 4 chars:', envConfig.ENCRYPTION_KEY.substring(0, 4));
    } else {
        console.log('ENCRYPTION_KEY NOT found in .env');
    }
} else {
    console.log('.env file NOT FOUND');
}
