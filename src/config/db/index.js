require('dotenv').config();
const mongoose = require('mongoose');

async function connect() {
	const uri = process.env.MONGODB_URI;

	if (!uri) {
		console.error('❌ Missing MONGODB_URI in .env file');
		process.exit(1);
	}

	try {
		await mongoose.connect(uri);
		console.log('✅ Connected successfully');
	} catch (error) {
		console.error('❌ Connect failed:', error);
	}
}

module.exports = {connect};
