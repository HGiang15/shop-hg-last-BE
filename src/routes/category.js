const express = require('express');
const router = express.Router();
const categoryController = require('./../app/controllers/CategoryController');
const upload = require('./../middleware/upload');

/**
 * @swagger
 * /categories/createCategory:
 *   post:
 *     summary: Tạo danh mục mới
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *       400:
 *         description: Thiếu ảnh danh mục
 *       500:
 *         description: Lỗi server
 */
router.post('/createCategory', upload.single('image'), categoryController.createCategory);

/**
 * @swagger
 * /categories/getAllCategories:
 *   get:
 *     summary: Lấy tất cả danh mục
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *       500:
 *         description: Lỗi server
 */
router.get('/getAllCategories', categoryController.getAllCategories);

/**
 * @swagger
 * /categories/getCategoryById/{id}:
 *   get:
 *     summary: Lấy danh mục theo ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục
 *     responses:
 *       200:
 *         description: Thông tin danh mục
 *       404:
 *         description: Không tìm thấy danh mục
 *       500:
 *         description: Lỗi server
 */
router.get('/getCategoryById/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /categories/updateCategory/{id}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy danh mục
 *       500:
 *         description: Lỗi server
 */
router.put('/updateCategory/:id', upload.single('image'), categoryController.updateCategory);

/**
 * @swagger
 * /categories/deleteCategory/{id}:
 *   delete:
 *     summary: Xoá danh mục
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID danh mục
 *     responses:
 *       200:
 *         description: Xoá thành công
 *       404:
 *         description: Không tìm thấy danh mục
 *       500:
 *         description: Lỗi server
 */
router.delete('/deleteCategory/:id', categoryController.deleteCategory);

router.get('/getCategoryByName/:name', categoryController.getCategoryByName);

module.exports = router;
