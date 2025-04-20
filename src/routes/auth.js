const express = require('express');
const router = express.Router();
const authController = require('./../app/controllers/AuthController');

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Thông tin đăng nhập sai hoặc chưa xác minh email
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Đăng ký người dùng
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - dateOfBirth
 *               - gender
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               password:
 *                 type: string
 *               role:
 *                 type: integer
 *                 description: Mặc định là 1 (người dùng thường)
 *     responses:
 *       201:
 *         description: Đăng ký thành công, gửi OTP đến email
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /user/verifyOTP:
 *   post:
 *     summary: Xác minh mã OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xác minh email thành công
 *       400:
 *         description: OTP không hợp lệ hoặc thiếu thông tin
 */
router.post('/verifyOTP', authController.verifyOTP);

/**
 * @swagger
 * /user/forgotPassword:
 *   post:
 *     summary: Quên mật khẩu - Gửi OTP đến email
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gửi OTP thành công
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.post('/forgotPassword', authController.forgotPassword);

/**
 * @swagger
 * /user/resetPassword:
 *   post:
 *     summary: Đặt lại mật khẩu bằng OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc OTP sai
 */
router.post('/resetPassword', authController.resetPassword);

module.exports = router;
