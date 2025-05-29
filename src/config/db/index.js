require('dotenv').config();
const mongoose = require('mongoose');

async function connect() {
	const uri =
		process.env.NODE_ENV === 'development'
			? process.env.process.env.MONGODB_URI_DEV
			: process.env.process.env.GOOGLE_CALLBACK_URL_PRODUCTION;

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
