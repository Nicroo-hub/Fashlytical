//Importing all packages needed
const getDb = require('../util/database').getDb;
const getDbForum = require('../util/database').getDbForum;
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;

//Post Class
class Post {
    //Constructor Function for a Post
    constructor(title, content, imagePath, creator, createdAt, countComments, comments, likes, dislikes, rated, id) {
        this.title = title;
        this.content = content;
        this.imagePath = imagePath;
        this.creator = creator;
        this.createdAt = createdAt;
        this.countComments = countComments;
        this.comments = comments;
        this.likes = likes;
        this.dislikes = dislikes;
        this.rated = rated;
        this._id = id ? new mongodb.ObjectId(id) : null;
    }

    // save a post to the database
    save() {
        const db = getDbForum();
        let dbOp;
        if (this._id) {
            dbOp = db.collection('posts').updateOne({ _id: this._id }, { $set: this });
        } else {
            dbOp = db.collection('posts').insertOne(this);
        }
        return dbOp;
    }

    // find a post by id
    static findById(postId) {
        const db = getDbForum();
        return db
            .collection('posts')
            .findOne({ _id: new ObjectId(postId) })
            .then(post => {
                return post;
            })
            .catch(err => {
                console.log(err);
            });
    }

    // add a comment to a post 
    addComment(comment, creatorId) {
        const dbShop = getDb();
        let newCount = this.countComments += 1;
        dbShop.collection('users').findOne({ _id: ObjectId(creatorId) }).then(user => {
            let imagePath = user.profilePicture;
            let creator = user.username;
            let updatedComments = [...this.comments];
            updatedComments.push({
                    commentId: new ObjectId(),
                    creator: creator,
                    creatorImg: imagePath,
                    createdAt: new Date().toISOString().slice(0, 10),
                    content: comment
                });
            this.countComments = newCount;
            this.comments = updatedComments;
            return this.save();
        });
    }

    // remove a comment from a post
    removeComment(commentId) {
        this.comments = this.comments.filter(c => c.commentId.toString() !== commentId.toString());
        this.countComments = this.countComments -= 1;
        return this.save();
    }

    // update a comment in a post
    updateComment(commentId, content) {
        this.comments = this.comments.map(c => {
            if (c.commentId.toString() === commentId.toString()) {
                return {
                    commentId: new ObjectId(commentId),
                    creator: c.creator,
                    creatorImg: c.creatorImg,
                    createdAt: c.createdAt,
                    content: content
                }
            } else {
                return c;
            }
        });
        this.save();
    }

    // like a post
    likePost(userId) {
        let rater = null;
        this.rated.forEach(r => {
            if (r.userId.toString() === userId.toString()) {
                rater = r;
            }
        });
        if (this.rated.some(r => r.userId === userId) && rater.method === 'dislike') {
            this.dislikes -= 1;
            this.likes += 1;
            let raters = [...this.rated];
            raters.pop(r => r.userId.toString() !== userId.toString());
            raters.push({
                userId: userId,
                method: 'like'
            });
            this.rated = raters;
            this.save();
        } else if (this.rated.some(r => r.userId === userId)) {
            return;
        } else {
            this.likes += 1;
            let raters = [...this.rated];
            raters.push({
                userId: userId,
                method: 'like'
            });
            this.rated = raters;
            this.save();
        }

    }
    
    // dislike a post
    dislikePost(userId) {   
        const db = getDbForum();
        let rater = null;
        this.rated.forEach(r => {
            if (r.userId.toString() === userId.toString()) {
                rater = r;
            }
        });
        if (this.rated.some(r => r.userId === userId) && rater.method === 'like') {
            this.likes -= 1;
            this.dislikes += 1;
            let raters = [...this.rated];
            raters.pop(r => r.userId.toString() !== userId.toString());
            raters.push({
                userId: userId,
                method: 'dislike'
            });
            db.collection('posts').updateOne({ _id: new ObjectId(this._id) }, { $set: {likes: this.likes, dislikes: this.dislikes, rated: raters} } );
        } else if (this.rated.some(r => r.userId === userId)) {
            return;
        } else {
            this.dislikes += 1;
            let raters = [...this.rated];
            raters.push({
                userId: userId,
                method: 'dislike'
            });
            db.collection('posts').updateOne({ _id: new ObjectId(this._id) }, { $set: {dislikes: this.dislikes, rated: raters} } );
        }
    }
}

// export the post class
module.exports = Post;