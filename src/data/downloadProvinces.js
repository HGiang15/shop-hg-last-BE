const fs = require('fs');
const path = require('path');
const axios = require('axios');

const url = 'https://provinces.open-api.vn/api/?depth=3';

const savePath = path.resolve(__dirname, 'vietnam.json');

async function downloadProvinces() {
	try {
		const response = await axios.get(url);
		fs.writeFileSync(savePath, JSON.stringify(response.data, null, 2), 'utf-8');
		console.log('✅ Dữ liệu tỉnh thành đã được lưu vào:', savePath);
	} catch (error) {
		console.error('❌ Lỗi khi tải dữ liệu:', error.message);
	}
}

downloadProvinces();
