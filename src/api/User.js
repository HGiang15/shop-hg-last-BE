require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const User = require('./../app/models/User');
const bcrypt = require('bcrypt');

const generateToken = (user) => {
	return jwt.sign({id: user._id, email: user.email, role: user.role}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
};

// Register
router.post('/register', async (req, res) => {
	try {
		let {name, email, dateOfBirth, gender, password, role} = req.body;
		name = name.trim();
		email = email.trim();
		dateOfBirth = dateOfBirth.trim();
		gender = gender.trim();
		password = password.trim();

		if (!name || !email || !dateOfBirth || !gender || !password) {
			return res.status(400).json({status: 'Failed', message: 'Empty input field.'});
		}
		if (!/^[a-zA-Z ]*$/.test(name)) {
			return res.status(400).json({status: 'Failed', message: 'Invalid name entered.'});
		}
		if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
			return res.status(400).json({status: 'Failed', message: 'Invalid email entered.'});
		}
		if (!new Date(dateOfBirth).getTime()) {
			return res.status(400).json({status: 'Failed', message: 'Invalid date of birth entered.'});
		}
		if (!['Male', 'Female', 'Other'].includes(gender)) {
			return res.status(400).json({status: 'Failed', message: 'Invalid gender entered.'});
		}
		if (password.length < 6) {
			return res.status(400).json({status: 'Failed', message: 'Password is too short.'});
		}

		// Kiểm tra role hợp lệ
		if (![0, 1].includes(role)) {
			role = 1; // Nếu không hợp lệ, đặt mặc định là user
		}

		const existingUser = await User.findOne({email});
		if (existingUser) {
			return res.status(409).json({status: 'Failed', message: 'User with the provided email already exists'});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = new User({name, email, dateOfBirth, gender, password: hashedPassword, role});
		const savedUser = await newUser.save();

		// Tạo token cho user mới
		const token = generateToken(savedUser);

		res.status(201).json({
			status: 'Success',
			message: 'Register successful',
			data: {id: savedUser._id, name, email, role},
			token,
		});
	} catch (error) {
		res.status(500).json({status: 'Failed', message: 'An error occurred while processing registration'});
	}
});

// Login
router.post('/login', async (req, res) => {
	try {
		let {email, password} = req.body;
		email = email.trim();
		password = password.trim();

		if (!email || !password) {
			return res.status(400).json({status: 'Failed', message: 'Empty credentials supplied'});
		}

		const user = await User.findOne({email});
		if (!user) {
			return res.status(401).json({status: 'Failed', message: 'Invalid credentials'});
		}

		const isPasswordMatch = await bcrypt.compare(password, user.password);
		if (!isPasswordMatch) {
			return res.status(401).json({status: 'Failed', message: 'Invalid password'});
		}

		// Tạo token
		const token = generateToken(user);

		res.status(200).json({
			status: 'Success',
			message: 'Login successful',
			data: {id: user._id, name: user.name, email: user.email, role: user.role},
			token,
		});
	} catch (error) {
		res.status(500).json({status: 'Failed', message: 'An error occurred while processing login'});
	}
});

module.exports = router;
