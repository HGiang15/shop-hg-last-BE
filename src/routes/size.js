const express = require('express');
const router = express.Router();
const sizeController = require('./../app/controllers/SizeController');

// POST: Create size
router.post('/createSize', sizeController.createSize);

// GET: All sizes
router.get('/getAllSizes', sizeController.getAllSizes);

// GET: Size by ID
router.get('/getSizeById/:id', sizeController.getSizeById);

// PUT: Update size
router.put('/updateSize/:id', sizeController.updateSize);

// DELETE: Delete size
router.delete('/deleteSize/:id', sizeController.deleteSize);

module.exports = router;
