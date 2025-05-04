const express = require('express');
const router = express.Router();
const sizeController = require('./../app/controllers/SizeController');

/**
 * @swagger
 * /size/createSize:
 *   post:
 *     summary: Tạo kích cỡ mới
 *     tags: [Size]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Size L"
 *               description:
 *                 type: string
 *                 example: "Dành cho người cao từ 170cm"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Thiếu tên kích cỡ
 *       500:
 *         description: Lỗi server
 */
router.post('/createSize', sizeController.createSize);

/**
 * @swagger
 * /size/getAllSizes:
 *   get:
 *     summary: Lấy danh sách tất cả kích cỡ
 *     tags: [Size]
 *     responses:
 *       200:
 *         description: Danh sách kích cỡ
 *       500:
 *         description: Lỗi server
 */
router.get('/getAllSizes', sizeController.getAllSizes);

/**
 * @swagger
 * /size/getSizeById/{id}:
 *   get:
 *     summary: Lấy thông tin kích cỡ theo ID
 *     tags: [Size]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của kích cỡ
 *     responses:
 *       200:
 *         description: Trả về thông tin kích cỡ
 *       404:
 *         description: Không tìm thấy kích cỡ
 *       500:
 *         description: Lỗi server
 */
router.get('/getSizeById/:id', sizeController.getSizeById);

/**
 * @swagger
 * /size/updateSize/{id}:
 *   put:
 *     summary: Cập nhật kích cỡ
 *     tags: [Size]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của kích cỡ cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Size XL"
 *               description:
 *                 type: string
 *                 example: "Cỡ lớn cho người trên 180cm"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy kích cỡ
 *       500:
 *         description: Lỗi server
 */
router.put('/updateSize/:id', sizeController.updateSize);

/**
 * @swagger
 * /size/deleteSize/{id}:
 *   delete:
 *     summary: Xóa kích cỡ theo ID
 *     tags: [Size]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của kích cỡ cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy kích cỡ
 *       500:
 *         description: Lỗi server
 */
router.delete('/deleteSize/:id', sizeController.deleteSize);

module.exports = router;
