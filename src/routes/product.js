const express = require('express');
const router = express.Router();
const productController = require('./../app/controllers/ProductController');

/**
 * @swagger
 * /api/product/createProduct:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               description:
 *                 type: string
 *               detailDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/createProduct', productController.createProduct);

/**
 * @swagger
 * /api/product/getAllProduct:
 *   get:
 *     summary: Lấy tất cả sản phẩm
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/getAllProduct', productController.getAllProduct);

/**
 * @swagger
 * /api/product/getProductById/{id}:
 *   get:
 *     summary: Lấy sản phẩm theo ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của sản phẩm
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/getProductById/:id', productController.getProductById);

/**
 * @swagger
 * /api/product/updateProduct/{id}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của sản phẩm cần cập nhật
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
 *               quantity:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               description:
 *                 type: string
 *               detailDescription:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.put('/updateProduct/:id', productController.updateProduct);

/**
 * @swagger
 * /api/product/deleteProduct/{id}:
 *   delete:
 *     summary: Xóa sản phẩm theo ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của sản phẩm cần xóa
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.delete('/deleteProduct/:id', productController.deleteProduct);

/**
 * @swagger
 * /api/product/deleteMultipleProducts:
 *   delete:
 *     summary: Xóa nhiều sản phẩm theo danh sách ID
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["661f7d7a29c2ab23abc12345", "661f7d7a29c2ab23abc67890"]
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.delete('/deleteMultipleProducts', productController.deleteMultipleProducts);

module.exports = router;
