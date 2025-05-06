const express = require('express');
const router = express.Router();
const productController = require('./../app/controllers/ProductController');
const upload = require('./../middleware/upload');

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
 *                 example: Áo Hoodie 2025
 *               category:
 *                 type: string
 *                 example: Áo khoác
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Đen", "Trắng", "Xanh"]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["image1.jpg", "image2.jpg"]
 *               quantityBySize:
 *                 type: object
 *                 additionalProperties:
 *                   type: integer
 *                 example:
 *                   S: 10
 *                   M: 15
 *                   L: 20
 *                   XL: 10
 *                   XXL: 5
 *                   XXXL: 2
 *               price:
 *                 type: number
 *                 example: 499000
 *               description:
 *                 type: string
 *                 example: Áo hoodie form rộng, thời trang
 *               detailDescription:
 *                 type: string
 *                 example: Chất liệu nỉ bông mềm mịn, phù hợp thời tiết se lạnh
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */

// router.post('/createProduct', productController.createProduct);
router.post('/createProduct', upload.array('images', 6), productController.createProduct);

/**
 * @swagger
 * /api/product/getAllProduct:
 *   get:
 *     summary: Lấy tất cả sản phẩm
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/getAllProducts', productController.getAllProducts);

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
 *       500:
 *         description: Lỗi server
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
 *                 example: Áo Hoodie 2025
 *               category:
 *                 type: string
 *                 example: Áo khoác
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Đen", "Trắng", "Xanh"]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["image1.jpg", "image2.jpg"]
 *               quantityBySize:
 *                 type: object
 *                 additionalProperties:
 *                   type: integer
 *                 example:
 *                   S: 10
 *                   M: 15
 *                   L: 20
 *                   XL: 10
 *                   XXL: 5
 *                   XXXL: 2
 *               price:
 *                 type: number
 *                 example: 499000
 *               description:
 *                 type: string
 *                 example: Áo hoodie form rộng, thời trang
 *               detailDescription:
 *                 type: string
 *                 example: Chất liệu nỉ bông mềm mịn, phù hợp thời tiết se lạnh
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi server
 */
// router.put('/updateProduct/:id', productController.updateProduct);
router.put('/updateProduct/:id', upload.array('images', 6), productController.updateProduct);

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
 *       500:
 *         description: Lỗi server
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
 *       500:
 *         description: Lỗi server
 */
router.delete('/deleteMultipleProducts', productController.deleteMultipleProducts);

/**
 * @swagger
 * /api/product/featuredProducts:
 *   get:
 *     summary: Lấy danh sách sản phẩm nổi bật
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/featuredProducts', productController.getFeaturedProducts);

/**
 * @swagger
 * /api/product/filter:
 *   get:
 *     summary: Lọc sản phẩm theo nhiều tiêu chí
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: colors
 *         schema: { type: string }
 *         description: Dạng CSV, ví dụ: Đen,Trắng
 *       - in: query
 *         name: size
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: isFeatured
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/filterProducts', productController.filterProducts);

module.exports = router;
