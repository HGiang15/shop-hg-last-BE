const express = require('express');
const router = express.Router();
const colorController = require('./../app/controllers/ColorController');

/**
 * @swagger
 * /api/color/createColor:
 *   post:
 *     summary: Tạo màu mới
 *     tags: [Color]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "#ffffff"
 *               name:
 *                 type: string
 *                 example: Trắng
 *               description:
 *                 type: string
 *                 example: Màu trắng tinh khiết
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/createColor', colorController.createColor);

/**
 * @swagger
 * /api/color/getAllColors:
 *   get:
 *     summary: Lấy tất cả màu
 *     tags: [Color]
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/getAllColors', colorController.getAllColors);

/**
 * @swagger
 * /api/color/getColorById/{id}:
 *   get:
 *     summary: Lấy chi tiết màu theo ID
 *     tags: [Color]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của màu
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy màu
 *       500:
 *         description: Lỗi server
 */
router.get('/getColorById/:id', colorController.getColorById);

/**
 * @swagger
 * /api/color/updateColor/{id}:
 *   put:
 *     summary: Cập nhật thông tin màu
 *     tags: [Color]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của màu cần cập nhật
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "#000000"
 *               name:
 *                 type: string
 *                 example: Đen
 *               description:
 *                 type: string
 *                 example: Màu đen huyền bí
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy màu
 *       500:
 *         description: Lỗi server
 */
router.put('/updateColor/:id', colorController.updateColor);

/**
 * @swagger
 * /api/color/deleteColor/{id}:
 *   delete:
 *     summary: Xóa màu theo ID
 *     tags: [Color]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của màu cần xóa
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy màu
 *       500:
 *         description: Lỗi server
 */
router.delete('/deleteColor/:id', colorController.deleteColor);

module.exports = router;
