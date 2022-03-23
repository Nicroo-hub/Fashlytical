//Importing all packages needed
const getDbForum = require('../util/database').getDbForum;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

//Topic Class
class Topic {
    // Constructor Function for a Topic
    constructor(title, description, imagePath, creator, createdAt, countPosts, posts, id) {
        this.title = title; // Name of the topic
        this.description = description; // Description of the topic
        this.imagePath = imagePath; // Image URL of the topic
        this.creator = creator; // Creator of the topic
        this.createdAt = createdAt; // Date of creation of the topic
        this.countPosts = countPosts; // Number of posts in the topic
        this.posts = posts; // Array of posts in the topic
        this._id = id ? new mongodb.ObjectId(id) : null; // MongoDB ObjectId
    }
    // Save a topic to the database
    save() {
        const db = getDbForum();
        let dbOp;
        if (this._id) {
            dbOp = db.collection('topics').updateOne({ _id: this._id }, { $set: this });
        } else {
            dbOp = db.collection('topics').insertOne(this);
        }
        return dbOp;
    };

    // Find a topic by id
    static findById(topicId) {
        const db = getDbForum();
        return db
            .collection('topics')
            .findOne({ _id: new ObjectId(topicId) })
            .then(topic => {
                return topic;
            })
            .catch(err => {
                console.log(err);
            });
    }

    // Find all posts in a topic
    getPosts() {
        const db = getDbForum();
        return db
            .collection('posts')
            .find({ _id: { $in: this.posts.map(p => ObjectId(p.postId)) } })
            .toArray()
            .then(posts => {
                return posts;
            })
            .catch(err => {
                console.log(err);
            });
    }

    // Add a post to a topic
    addPost(post) {
        let updatedPosts = [...this.posts];
        updatedPosts.push({
                postId: new ObjectId(post._id),
                title: post.title,
                creator: post.creator,
                createdAt: post.createdAt,
                imagePath: post.imagePath
            });
        let newCount = this.countPosts += 1;
        this.countPosts = newCount;
        this.posts = updatedPosts;
        return this.save();
    }

    // Remove a post from a topic
    removePost(post) {
        let updatedPosts = [...this.posts];
        this.posts = updatedPosts.filter(p => p.postId.toString() !== post._id.toString());
        this.countPosts = this.countPosts -= 1;
        return this.save();      
    }

    // Update a post in a topic
    updatePosts(post) {
        let updatedPosts = [...this.posts];
        this.posts = updatedPosts.map(p => {
            if (p.postId.toString() === post._id.toString()) {
                return {
                    postId: new ObjectId(post._id),
                    title: post.title,
                    creator: post.creator,
                    createdAt: post.createdAt,
                    imagePath: post.imagePath
                }
            } else {
                return p;
            }
        });
        return this.save();
    }
}

// Export the Topic class
module.exports = Topic;