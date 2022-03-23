//Importing all packages needed
const express = require('express');
const postsController = require('../controllers/posts');
const router = express.Router();

// GET Posts
router.get('/posts', postsController.getPosts);

// POST Posts
router.post('/posts', postsController.createPost);

// POST Delete Post
router.delete('/posts/deletePost', postsController.deletePost);

// POST Update Post
router.put('/posts/updatePost', postsController.updatePost);

//POST Comments
router.post('/comments', postsController.addComment);

// POST Delete Comment
router.delete('/comments/deleteComment', postsController.deleteComment);

// POST Update Comment
router.put('/comments/updateComment', postsController.updateComment);

// POST Like
router.post('/posts/likePost', postsController.likePost);

// POST Dislike
router.post('/posts/dislikePost', postsController.dislikePost);

// export the post class
module.exports = router;