const Location = require('../models/Location');

// GET /api/locations/provinces
exports.getProvinces = async (req, res) => {
	try {
		const provinces = await Location.find({}, {_id: 1, name: 1});
		res.json(provinces);
	} catch (err) {
		res.status(500).json({message: 'Server error'});
	}
};

// GET /api/locations/districts/:provinceId
exports.getDistricts = async (req, res) => {
	try {
		const province = await Location.findById(req.params.provinceId);
		if (!province) return res.status(404).json({message: 'Province not found'});
		// Trả về danh sách districts kèm id và name
		const districts = province.districts.map((d) => ({
			_id: d._id,
			name: d.name,
		}));
		res.json(districts);
	} catch (err) {
		res.status(500).json({message: 'Server error'});
	}
};

// GET /api/locations/wards/:districtId
exports.getWards = async (req, res) => {
	try {
		// Tìm tỉnh chứa quận có _id = req.params.districtId
		const province = await Location.findOne({'districts._id': req.params.districtId});
		if (!province) return res.status(404).json({message: 'District not found'});

		// Tìm quận cụ thể trong danh sách districts
		const district = province.districts.id(req.params.districtId);
		if (!district) return res.status(404).json({message: 'District not found'});

		// Trả về danh sách wards kèm id và name
		const wards = district.wards.map((w) => ({
			_id: w._id,
			name: w.name,
		}));
		res.json(wards);
	} catch (err) {
		res.status(500).json({message: 'Server error'});
	}
};
