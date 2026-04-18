const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/SearchController');

router.post('/chat', (req, res) => SearchController.handleChat(req, res));
router.get('/history', (req, res) => SearchController.getHistory(req, res));
router.get('/conversation/:id', (req, res) => SearchController.getConversation(req, res));

module.exports = router;
