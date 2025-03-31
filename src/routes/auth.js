const express = require('express');
const router = express.Router();
const authController = require('./../app/controllers/AuthController');

router.post('/register', authController.register);
router.post('/verifyOTP', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword', authController.resetPassword);

module.exports = router;
