const express = require('express');
const router = express.Router();
const authController = require('./../app/controllers/AuthController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/user/login:
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
 * /api/user/register:
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
 * /api/user/verifyOTP:
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
 * /api/user/forgotPassword:
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
 * /api/user/resetPassword:
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

router.post('/change-password', auth, authController.changePassword);

/**
 * @swagger
 * /api/user/list:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Lấy danh sách người dùng thành công
 */
router.get('/getListUser', authController.getListUser);

/**
 * @swagger
 * /api/user/getUserById/{id}:
 *   get:
 *     summary: Lấy thông tin người dùng theo ID
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/getUserById/:id', authController.getUserById);

/**
 * @swagger
 * /api/user/editUser/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.put('/editUser/:id', authController.editUser);

router.put('/status/:id', authController.updateUserStatus);

router.put('/role/:id', authController.updateUserRole);

router.get('/me', auth, authController.getMe);

// --- Google Login ---
/**
 * @swagger
 * /api/user/google-login:
 *   post:
 *     summary: Đăng nhập bằng Google OAuth
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID Token
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       400:
 *         description: Token không hợp lệ
 */
router.post('/google-login', authController.googleLogin);

module.exports = router;
