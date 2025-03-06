require('dotenv').config();
const mongoose = require('mongoose');

async function connect() {
	const uri = process.env.MONGODB_URI;

	if (!uri) {
		console.error('❌ Missing MONGODB_URI in .env file');
		process.exit(1); // Dừng chương trình nếu không có URI
	}

	try {
		await mongoose.connect(uri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('✅ Connected successfully');
	} catch (error) {
		console.error('❌ Connect failed:', error);
	}
}

module.exports = {connect};

// C2
// const mongoose = require("mongoose");

// async function connect() {
//     try {
//         await mongoose.connect("mongodb://localhost:27017/shop-hg-dev", {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log("Connect successfully");
//     } catch (error) {
//         console.log("Connect failed");
//     }
// }

// module.exports = { connect };
