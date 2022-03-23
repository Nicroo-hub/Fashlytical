//Importing all packages needed
const getDbForum = require('../util/database').getDbForum;
const Post = require('../models/post');
const Topic = require('../models/topic');
const ObjectId = require('mongodb').ObjectId;


// function for getting all the posts from the database
exports.getPosts = (req, res, next) => {
    const db = getDbForum();
    const topicId = req.body.topicId;
    return db.collection('topics').findOne({ _id: ObjectId(topicId) }).then(topic => {
        let newTopic =  new Topic(topic.title, topic.description, topic.imagePath, topic.creator, topic.createdAt, topic.countPosts, topic.posts, topic._id);
        newTopic.getPosts().then(posts => {
            return res.status(200).json({
                message: 'Fetched posts successfully.',
                posts: posts,
                totalPosts: posts.length
            });
            }).catch(err => {
                console.log(err);
            });
        });
};

// function for adding a new post to the database
exports.createPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    let imagePath = req.body.imagePath;
    imagePath = imagePath.replace('public\\', '');
    const creator = req.body.creator;
    const createdAt = new Date().toISOString().slice(0, 10);
    let countComments = 0;
    let comments = [];
    let likes = 0;
    let dislikes = 0;
    let rated = [];
    const post = new Post(title, content, imagePath, creator, createdAt, countComments, comments, likes, dislikes, rated);
    const topicId = req.body.topicId;
    const db = getDbForum();
    post.save();
    db.collection('topics').findOne({ _id: ObjectId(topicId) }).then(topic => {
        let newTopic =  new Topic(topic.title, topic.description, topic.imagePath, topic.creator, topic.createdAt, topic.countPosts, topic.posts, topic._id);
        newTopic.addPost(post);
    }).then(
        res.status(201).json({
            message: 'Post created successfully!',
            post: { title: title, content: content, imagePath: imagePath, creator: creator, createdAt: createdAt, countComments: countComments, comments: comments, likes: likes, dislikes: dislikes, rated: rated }
    }));
};

// function for deleting a post from the database
exports.deletePost = (req, res, next) => {
    const postId = req.body.postId;
    const topicId = req.body.topicId;
    const db = getDbForum();
    Post.findById(postId).then(post => {
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        db.collection('topics').findOne({ _id: ObjectId(topicId) }).then(topic => { 
            let newTopic =  new Topic(topic.title, topic.description, topic.imagePath, topic.creator, topic.createdAt, topic.countPosts, topic.posts, topic._id);
            newTopic.removePost(post);
        })
        .then(result => {
            return db.collection('posts').deleteOne({ _id: new ObjectId(postId) })
                .then(result => {
                    res.status(200).json({ message: 'Post deleted.' });
                });
        })
        });
};

// function for updating a post in the database
exports.updatePost = (req, res, next) => {
    const db = getDbForum();
    const postId = req.body.postId;
    const title = req.body.title;
    const content = req.body.content;
    const creator = req.body.creator;
    const createdAt = new Date().toISOString().slice(0, 10);
    let imagePath = req.body.imagePath;
    if (req.file) {
        imagePath = req.file.path;
    }
    if (!imagePath) {
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }
    db.collection('topics').findOne({ _id: ObjectId(req.body.topicId) }).then(topic => {
        let newTopic =  new Topic(topic.title, topic.description, topic.imagePath, topic.creator, topic.createdAt, topic.countPosts, topic.posts, topic._id);
        Post.findById(postId).then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            post.title = title;
            post.content = content;
            post.imagePath = imagePath;
            post.creator = creator;
            post.createdAt = createdAt;
            newTopic.updatePosts(post);
            return db.collection('posts').updateOne({ _id: new ObjectId(postId) }, { $set: post })
            .then(result => {
                res.status(200).json({ message: 'Post updated!', post: result });
            });
        })
    });
};

// function for adding a comment to a post
exports.addComment = (req, res, next) => {
    const db = getDbForum();
    const postId = req.body.postId;
    const comment = req.body.comment;
    const creator = req.body.creatorId;
    db.collection('posts').findOne({ _id: ObjectId(postId) }).then(post => {
        let newPost = new Post(post.title, post.content, post.imagePath, post.creator, post.createdAt, post.countComments, post.comments, post.likes, post.dislikes, post.rated, post._id);
        newPost.addComment(comment, creator);
    }).then(
        res.status(201).json({
            message: 'Comment created successfully!',
            comment: { content: comment, creator: creator }
        }));
};

// function for deleting a comment from a post
exports.deleteComment = (req, res, next) => {
    const db = getDbForum();
    const postId = req.body.postId;
    const commentId = req.body.commentId;
    db.collection('posts').findOne({ _id: ObjectId(postId) }).then(post => {
        let newPost = new Post(post.title, post.content, post.imagePath, post.creator, post.createdAt, post.countComments, post.comments, post.likes, post.dislikes, post.rated, post._id);
        console.log(newPost);
        newPost.removeComment(commentId);
    }).then(result => {
            res.status(200).json({ message: 'Comment deleted.' });
        });
};

// function for updating a comment in a post    
exports.updateComment = (req, res, next) => {
    const db = getDbForum();
    const postId = req.body.postId;
    const commentId = req.body.commentId;
    const content = req.body.content;
    db.collection('posts').findOne({ _id: ObjectId(postId) }).then(post => {
        let newPost = new Post(post.title, post.content, post.imagePath, post.creator, post.createdAt, post.countComments, post.comments, post.likes, post.dislikes, post.rated, post._id);
        newPost.updateComment(commentId, content);
    }).then(result => {
            res.status(200).json({ message: 'Comment updated.' });
        });
};

// function for adding a like to a post
exports.likePost = (req, res, next) => {
    const db = getDbForum();
    let postId = req.body.postId;
    let userId = req.body.userId;
    db.collection('posts').findOne({ _id: ObjectId(postId) }).then(post => {
        let newPost = new Post(post.title, post.content, post.imagePath, post.creator, post.createdAt, post.countComments, post.comments, post.likes, post.dislikes, post.rated, post._id);
        newPost.likePost(userId);
    }).then(result => {
            res.status(200).json({ message: 'Post Liked!' });
        });
};

// function for adding a dislike to a post
exports.dislikePost = (req, res, next) => {
    const db = getDbForum();
    let postId = req.body.postId;
    let userId = req.body.userId;
    db.collection('posts').findOne({ _id: ObjectId(postId) }).then(post => {
        let newPost = new Post(post.title, post.content, post.imagePath, post.creator, post.createdAt, post.countComments, post.comments, post.likes, post.dislikes, post.rated, post._id);
        newPost.dislikePost(userId);
    }).then(result => {
            res.status(200).json({ message: 'Post Disliked!' });
        });
};