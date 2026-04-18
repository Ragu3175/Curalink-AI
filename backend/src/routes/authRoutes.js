const express = require('express');
const router = express.Router();
const { register, login, completeOnboarding, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/onboarding', protect, completeOnboarding);
router.get('/me', protect, getMe);

module.exports = router;
