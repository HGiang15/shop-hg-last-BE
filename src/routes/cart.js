const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

/**
 * @swagger
 * /api/cart/getAllCart:
 *   get:
 *     summary: Get cart items
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart fetched successfully
 */
router.get('/getAllCart', optionalAuth, cartController.getAllCart);

/**
 * @swagger
 * /api/cart/addToCart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               sizeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/addToCart', optionalAuth, cartController.addToCart);

/**
 * @swagger
 * /api/cart/updateItem:
 *   put:
 *     summary: Update item quantity in cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item updated successfully
 */
router.put('/updateItem', optionalAuth, cartController.updateItem);

/**
 * @swagger
 * /api/cart/removeItem/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed successfully
 */
router.delete('/removeItem/:itemId', optionalAuth, cartController.removeItem);

/**
 * @swagger
 * /api/cart/mergeCart:
 *   post:
 *     summary: Merge guest cart with user cart after login
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               localItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     sizeId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Cart merged successfully
 */
router.post('/mergeCart', auth, cartController.mergeCart);

module.exports = router;
