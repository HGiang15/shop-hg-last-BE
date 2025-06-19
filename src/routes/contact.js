const express = require('express');
const router = express.Router();
const contactController = require('../app/controllers/ContactController');
const auth = require('../middleware/auth');

router.post('/', contactController.createContactMessage);

router.get('/', auth, contactController.getAllMessages);

router.get('/:id', auth, contactController.getMessageById);

router.put('/:id/status', auth, contactController.updateMessageStatus);

router.delete('/:id', auth, contactController.deleteMessage);

// ✅ [Admin]: Gửi email trả lời cho một tin nhắn
router.post('/:id/reply', auth, contactController.replyToMessage);

module.exports = router;
