const express = require('express');
const router = express.Router();
const userAddressController = require('./../app/controllers/UserAddressController');
const auth = require('../middleware/auth');

router.post('/createAddress', auth, userAddressController.createAddress);
router.get('/getUserAddresses', auth, userAddressController.getUserAddresses);
router.put('/updateAddress/:id', auth, userAddressController.updateAddress);
router.put('/setDefaultAddress/:id', auth, userAddressController.setDefaultAddress);
router.delete('/deleteAddress/:id', auth, userAddressController.deleteAddress);

module.exports = router;
