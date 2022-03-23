//Importing all packages needed
const getDb = require('../util/database').getDb;
const getDbForum = require('../util/database').getDbForum;
const Rating = require('../models/rating');
const Topic = require('../models/topic');
const ObjectId = require('mongodb').ObjectId;

//Get all topics from database
exports.getTopics = (req, res, next) => {
    const db = getDbForum();
    const currentPage = req.query.page || 1;
    const perPage = 3;
    let totalTopics;
    db.collection('topics').count().then(count => {
        totalTopics = count;
        return db.collection('topics').find()
            .skip(currentPage > 0 ? ( ( currentPage - 1 ) * perPage ) : 0).limit(perPage)
            .toArray()
            .then(topics => {
                return res.status(200).json({
                    message: 'Fetched topics successfully.',
                    topics: topics,
                    totalTopics: totalTopics
                });
            }).catch(err => {
                console.log(err);
            });
    });
};

// add a topic to the database
exports.createTopic = (req, res, next) => {
    const title = req.body.title;
    const description = req.body.description;
    let imagePath = req.body.imagePath;
    imagePath = imagePath.replace('public\\', '');
    const creator = req.body.creator;
    const createdAt = new Date().toISOString().slice(0, 10);
    let countPosts = 0;
    let posts = [];
    const topic = new Topic(title, description, imagePath, creator, createdAt, countPosts, posts);
    topic.save();
    res.status(201).json({
        message: 'Topic created successfully!',
        topic: { title: title, description: description, imagePath: imagePath, creator: creator, createdAt: createdAt, countPosts: countPosts, posts: posts }
    });
};

// delete a topic from the database
exports.deleteTopic = (req, res, next) => {
    const topicId = req.body.topicId;
    const db = getDbForum();
    Topic.findById(topicId).then(topic => {
        let newTopic = new Topic(topic.title, topic.description, topic.imagePath, topic.creator, topic.createdAt, topic.countPosts, topic.posts);
        newTopic.getPosts().then(posts => {
            posts.forEach(post => {
                db.collection('posts').deleteOne({ _id: new ObjectId(post._id) });
            });
        });
        if (!topic) {
            const error = new Error('Could not find topic.');
            error.statusCode = 404;
            throw error;
        }
        return db.collection('topics').deleteOne({ _id: new ObjectId(topicId) })
            .then(result => {
                res.status(200).json({ message: 'Topic deleted.' });
            })
    })
};

// update a topic in the database
exports.updateTopic = (req, res, next) => {
    const db = getDbForum();
    const topicId = req.body.topicId;
    const title = req.body.title;
    const description = req.body.description;
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
    Topic.findById(topicId).then(topic => {
        if (!topic) {
            const error = new Error('Could not find topic.');
            error.statusCode = 404;
            throw error;
        }
        topic.title = title;
        topic.description = description;
        topic.imagePath = imagePath;
        topic.creator = creator;
        topic.createdAt = createdAt;
        return db.collection('topics').updateOne({ _id: new ObjectId(topicId) }, { $set: topic })
        .then(result => {
            res.status(200).json({ message: 'Topic updated!', topic: result });
        });
    })
};

// rate a product (1-5 stars)
exports.rateProduct = (req, res, next) => {
    const db = getDb();
    let productId = req.body.productId;
    let productName = req.body.productName;
    let userId = req.body.userId;
    let stars = req.body.stars;
    return db.collection('ratings').find().toArray().then(ratings => {
        let foundId = false;
        ratings.forEach(r => {
            if(userId === r.userId && productId === r.productId) {
                foundId = true;
                let rating = new Rating(productId, productName, userId, stars, r._id);
                rating.updateRating(stars);
            }
        });
        if (!foundId) {
            let rating = new Rating(productId, productName, userId, stars);
            rating.save();
        }
    }).then(result => {
        res.status(201).json({
            message: 'Rating updated successfully!',
            rating: { productId: productId, productName: productName, userId: userId, stars: stars }
        });
    });
};