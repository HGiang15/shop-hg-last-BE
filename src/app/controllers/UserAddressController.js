const UserAddress = require('../models/UserAddress');

exports.getUserAddresses = async (req, res) => {
	try {
		const addresses = await UserAddress.find({userId: req.user._id});
		res.json(addresses);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
};

exports.createAddress = async (req, res) => {
	try {
		const newAddress = new UserAddress({
			...req.body,
			userId: req.user._id,
		});

		await newAddress.save();
		res.status(201).json(newAddress);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
};

exports.updateAddress = async (req, res) => {
	try {
		// const address = await UserAddress.findOneAndUpdate({_id: req.params.id, user: req.user._id}, req.body, {new: true});
		const address = await UserAddress.findOneAndUpdate({_id: req.params.id, userId: req.user._id}, req.body, {new: true});
		if (!address) return res.status(404).json({message: 'Address not found'});

		res.json(address);
	} catch (err) {
		res.status(500).json({error: err.message});
	}
};

exports.setDefaultAddress = async (req, res) => {
	try {
		const {id} = req.params;
		const address = await UserAddress.findById(id);

		if (!address) {
			return res.status(400).json({error: 'Không tìm thấy địa chỉ.'});
		}

		// Bỏ default cũ, đặt default mới
		await UserAddress.updateMany({userId: address?.userId}, {isDefault: false});
		await UserAddress.findByIdAndUpdate(id, {isDefault: true}, {new: true});

		return res.status(200).json({error: 'Cập nhật địa chỉ mặc định thành công!'});
	} catch (error) {
		return res.status(500).json({error: error.message});
	}
};

exports.deleteAddress = async (req, res) => {
	try {
		const deleted = await UserAddress.findOneAndDelete({
			_id: req.params.id,
			userId: req.user._id,
		});
		if (!deleted) return res.status(404).json({message: 'Address not found'});
		res.json({message: 'Address deleted'});
	} catch (err) {
		res.status(500).json({error: err.message});
	}
};
