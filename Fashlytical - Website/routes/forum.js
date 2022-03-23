//Importing all packages needed
const express = require('express');
const forumController = require('../controllers/forum');
const router = express.Router();
const multer = require('multer');

//Definining the storage engine for profile pictures
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        var destinationPath = 'public/';
            destinationPath += 'images/profilepics/';
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

//Definining the storage engine for topic pictures
const fileStorageTopic = multer.diskStorage({
    destination: (req, file, cb) => {
        var destinationPath = 'public/';
            destinationPath += 'images/topicsimages/';
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

//Definining the storage engine for post pictures
const fileStoragePost = multer.diskStorage({
    destination: (req, file, cb) => {
        var destinationPath = 'public/';
            destinationPath += 'images/postsimages/';
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

//Filtering acceptable file types
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/gif') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

//All the routing for the forum's purposes

//route for creating a topic
router.post('/forum', multer({storage: fileStorageTopic, fileFilter: fileFilter}).single('topic'), forumController.createTopic);

//route for getting the update topic page
router.get('/forum/:topicId', forumController.getUpdateTopic);

//route for updating a topic
router.post('/forum/:topicId', multer({storage: fileStorageTopic, fileFilter: fileFilter}).single('topicimage'), forumController.updateTopic);

//route for deleting a topic
router.post('/topic', forumController.deleteTopic);

//route for getting the posts page
router.get('/posts/:topicId', forumController.getPosts);

//route for creating a post
router.post('/posts/:topicId', multer({storage: fileStoragePost, fileFilter: fileFilter}).single('post') , forumController.createPost);

//route for getting the update post page
router.get('/posts/:topicId/:postId', forumController.getUpdatePost);

//route for updating a post
router.post('/posts/:topicId/:postId', multer({storage: fileStoragePost, fileFilter: fileFilter}).single('postimage'), forumController.updatePost);

//route for deleting a post
router.post('/posts', forumController.deletePost);

//route for handling a post's rating (likes/dislikes)
router.post('/likedislike', forumController.HandlePostRating);

//route for getting the post's comments page
router.get('/comments/:postId', forumController.getComments);

//route for creating a comment in a post
router.post('/comments/:postId', forumController.createComment);

//route for handling a comment in a post (deleting/updating)
router.post('/comments', forumController.HandleComments);

//route for getting the user's profile page through a topic/post
router.post('/userProfile', forumController.userProfile);

//route for getting the user's profile page
router.get('/profile', forumController.getProfile);

//route for adding a profile picture to the user's profile
router.post('/profile', multer({storage: fileStorage, fileFilter: fileFilter}).single('image'), forumController.postAddProfilePic);

//route for getting the staff page
router.get('/staff', forumController.getStaff);

//route for posting the staff page (sending an application)
router.post('/staff', forumController.postStaff);

//route for getting the product ratings page (through the topic)
router.get('/ratings', forumController.getRatings);

//route for handling the ratings of the products
router.post('/ratings', forumController.HandleProductRating);

//exporting all the routes
module.exports = router;