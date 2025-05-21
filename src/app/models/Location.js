const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
	wardId: String,
	name: String,
});

const districtSchema = new mongoose.Schema({
	districtId: String,
	name: String,
	wards: [wardSchema],
});

const provinceSchema = new mongoose.Schema({
	provinceId: String,
	name: String,
	districts: [districtSchema],
});

module.exports = mongoose.model('Location', provinceSchema);
