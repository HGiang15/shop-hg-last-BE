const express = require('express');
const router = express.Router();
const contactController = require('../app/controllers/ContactController');
const auth = require('../middleware/auth');

router.post('/createContactMessage', contactController.createContactMessage);

router.get('/getAllMessages', auth, contactController.getAllMessages);

router.get('/getMessageById/:id', auth, contactController.getMessageById);

router.put('/updateMessageStatus/:id/status', auth, contactController.updateMessageStatus);

router.delete('/deleteMessage/:id', auth, contactController.deleteMessage);

// ✅ [Admin]: Gửi email trả lời cho một tin nhắn
router.post('/replyToMessage/:id/reply', auth, contactController.replyToMessage);

module.exports = router;
