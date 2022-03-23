//Importing all packages needed
const express = require('express');
const topicsController = require('../controllers/topics');
const router = express.Router();

// GET Topics
router.get('/forum', topicsController.getTopics);

// POST Topics
router.post('/forum', topicsController.createTopic);

// post delete topic
router.delete('/forum/deleteTopic', topicsController.deleteTopic);

// post update topic
router.put('/forum/updateTopic', topicsController.updateTopic);

// post rate a product (1-5 stars)
router.post('/rating/rateProduct', topicsController.rateProduct);

// export the post class
module.exports = router;