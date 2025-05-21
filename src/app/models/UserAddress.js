const mongoose = require('mongoose');

const UserAddressSchema = new mongoose.Schema(
	{
		userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
		name: {type: String, required: true},
		phone: {type: String, required: true},
		address: {type: String, required: true},
		isDefault: {type: Boolean, required: false},
		province: {
			provinceId: {type: String, required: true},
			name: {type: String, required: true},
		},
		district: {
			districtId: {type: String, required: true},
			name: {type: String, required: true},
		},
		ward: {
			wardId: {type: String, required: true},
			name: {type: String, required: true},
		},
	},
	{timestamps: true}
);

module.exports = mongoose.model('UserAddress', UserAddressSchema);
