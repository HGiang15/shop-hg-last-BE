require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Location = require('../app/models/Location');

const jsonPath = path.resolve(__dirname, 'vietnam.json');
const rawData = fs.readFileSync(jsonPath);
const provinces = JSON.parse(rawData);

mongoose
	.connect(process.env.NODE_ENV === 'development' ? process.env.MONGODB_URI_DEV : process.env.MONGODB_URI_PRODUCTION)
	.then(async () => {
		console.log('✅ Kết nối MongoDB thành công');

		await Location.deleteMany({});
		await Location.insertMany(
			provinces.map((province) => ({
				provinceId: province.code.toString(),
				name: province.name,
				districts: province.districts.map((district) => ({
					districtId: district.code.toString(),
					name: district.name,
					wards: district.wards.map((ward) => ({
						wardId: ward.code.toString(),
						name: ward.name,
					})),
				})),
			}))
		);

		console.log('✅ Dữ liệu tỉnh/thành đã được import thành công');
		mongoose.disconnect();
	})
	.catch((err) => {
		console.error('❌ Lỗi khi import:', err.message);
	});
