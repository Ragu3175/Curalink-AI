const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const SearchController = require('../controllers/SearchController');

router.post('/chat', protect, (req, res) => SearchController.handleChat(req, res));
router.get('/history', protect, (req, res) => SearchController.getHistory(req, res));
router.get('/conversation/:id', protect, (req, res) => SearchController.getConversation(req, res));

module.exports = router;
