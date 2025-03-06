const express = require('express');
const router = express.Router();
const User = require('./../app/models/User');
const bcrypt = require('bcrypt');

// Register
router.post('/register', (req, res) => {
	let {name, email, dateOfBirth, gender, password} = req.body;
	name = name.trim();
	email = email.trim();
	dateOfBirth = dateOfBirth.trim();
	gender = gender.trim();
	password = password.trim();

	if (name == '' || email == '' || dateOfBirth == '' || gender == '' || password == '') {
		res.json({
			status: 'Failed',
			message: 'Empty input field.',
		});
	} else if (!/^[a-zA-Z ]*$/.test(name)) {
		res.json({
			status: 'Failed',
			message: 'Invalid name entered.',
		});
	} else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
		res.json({
			status: 'Failed',
			message: 'Invalid email entered.',
		});
	} else if (!new Date(dateOfBirth).getTime()) {
		res.json({
			status: 'Failed',
			message: 'Invalid date of birth entered.',
		});
	} else if (!['Male', 'Female', 'Other'].includes(gender)) {
		return res.json({
			status: 'Failed',
			message: 'Invalid gender entered.',
		});
	} else if (password.length < 6) {
		return res.json({
			status: 'Failed',
			message: 'Password is too short.',
		});
	} else {
		// Checking if user already exists
		User.find({email})
			.then((result) => {
				if (result.length) {
					// A user already exists
					res.json({
						status: 'Failed',
						message: 'User with the provided email already exists',
					});
				} else {
					// Try to create a new user

					// password handling
					const saltRounds = 10;
					bcrypt
						.hash(password, saltRounds)
						.then((hashedPassword) => {
							const newUser = new User({
								name,
								email,
								dateOfBirth,
								gender,
								password: hashedPassword,
							});

							newUser
								.save()
								.then((result) => {
									res.json({
										status: 'Success',
										message: 'Register successful',
										data: result,
									});
								})
								.catch((err) => {
									res.json({
										status: 'Failed',
										message: 'An error occurred while saving user account!',
									});
								});
						})
						.catch((err) => {
							res.json({
								status: 'Failed',
								message: 'An error occurred while hashing password!',
							});
						});
				}
			})
			.catch((err) => {
				console.log(err);
				res.json({
					status: 'Failed',
					message: 'An error occurred while checking for existing user!',
				});
			});
	}
});

// Login
router.post('/login', (req, res) => {
	let {email, password} = req.body;
	email = email.trim();
	password = password.trim();

	if (email == '' || password == '') {
		res.json({
			status: 'Failed',
			message: 'Empty credential supplied',
		});
	} else {
		User.find({email})
			.then((data) => {
				if (data.length) {
					// User exists

					const hashedPassword = data[0].password;
					bcrypt
						.compare(password, hashedPassword)
						.then((result) => {
							if (result) {
								// Password match
								res.json({
									status: 'Success',
									message: 'Login successful',
									data: data,
								});
							} else {
								res.json({
									status: 'Failed',
									message: 'Invalid password entered!',
								});
							}
						})
						.catch((err) => {
							res.json({
								status: 'Failed',
								message: 'An error occurred while comparing passwords',
							});
						});
				} else {
					res.json({
						status: 'Failed',
						message: 'Invalid credentials entered!',
					});
				}
			})
			.catch((err) => {
				res.json({
					status: 'Failed',
					message: 'An error occurred while checking for existing user!',
				});
			});
	}
});

module.exports = router;
