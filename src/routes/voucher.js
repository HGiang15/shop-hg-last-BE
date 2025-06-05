const express = require('express');
const router = express.Router();
const voucherController = require('./../app/controllers/VoucherController');
const auth = require('../middleware/auth');

router.post('/applyVoucher', auth, voucherController.applyVoucher);
router.post('/createVoucher', auth, voucherController.createVoucher);
router.get('/getAllVouchers', auth, voucherController.getAllVouchers);
router.get('/getAvailableVouchersForUser', auth, voucherController.getAvailableVouchersForUser);
router.get('/getVoucherById/:id', auth, voucherController.getVoucherById);
router.put('/updateVoucher/:id', auth, voucherController.updateVoucher);
router.delete('/deleteVoucher/:id', auth, voucherController.deleteVoucher);

module.exports = router;
