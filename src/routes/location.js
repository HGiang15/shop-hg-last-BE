const express = require('express');
const router = express.Router();
const locationController = require('./../app/controllers/LocationController');

router.get('/provinces', locationController.getProvinces);
router.get('/districts/:provinceId', locationController.getDistricts);
router.get('/wards/:districtId', locationController.getWards);

module.exports = router;
