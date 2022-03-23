//Importing all packages needed
const request = require('request');
const Product = require('../models/product');
const User = require('../models/user');
const Moderator = require('../models/moderator');
const Admin = require('../models/admin');
const getDb = require('../util/database').getDb;
const getDbForum = require('../util/database').getDbForum;
const mongodb = require('mongodb');
const fileHelper = require('../util/file');
const ObjectId = mongodb.ObjectId;

//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//----------------------------------------------------------Functions related to the API---------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//

//Function for creating a topic 
exports.createTopic = (req, res, next) => {
    let imagePath = "images\\shop\\logo-yellow.jpeg";
    if (req.file) {
        imagePath = req.file.path;
    }
    request.post('http://localhost:8080/forum', {
        json: {
            title: req.body.title,
            description: req.body.description,
            imagePath: imagePath,
            creator: req.user.username
        }
    },
        function (err, response, body) {
            if (!err && response.statusCode == 201) {
                console.log(body);
            }
            return res.redirect('/forum');
        })
};

//Function for deleting a topic
exports.deleteTopic = (req, res, next) => {
    const db = getDbForum();
    const topicId = req.body.topicId;
    var data = {
        topicId: topicId,
    };
    const headers = {
        'Content-Type': 'application/json'
    };
    const options = {
        headers: headers,
        url: 'http://localhost:8080/forum/deleteTopic',
        method: "DELETE",
        json: data
    };
    db.collection('topics').findOne({ _id: ObjectId(topicId) }).then(topic => {
        fileHelper.deleteFile("public/" + topic.imagePath);
        topic.posts.forEach(post => {
            fileHelper.deleteFile("public/" + post.imagePath);
        });
        request(options,
            function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log(body);
                }
                return res.redirect('/forum');
            })
    });
};

//function for updating a topic
exports.updateTopic = (req, res, next) => {
    const db = getDbForum();
    const topicId = req.body.topicId;
    const imagePath = req.file.path.replace('public\\', '');
    var data = {
        topicId: topicId,
        title: req.body.title,
        description: req.body.description,
        imagePath: imagePath,
        creator: req.body.creator
    };
    const headers = {
        'Content-Type': 'application/json'
    };
    const options = {
        headers: headers,
        url: 'http://localhost:8080/forum/updateTopic',
        method: "PUT",
        json: data
    };
    db.collection('topics').findOne({ _id: ObjectId(topicId) }).then(topic => {
        fileHelper.deleteFile("public/" + topic.imagePath);
        request(options,
            function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log(body);
                }
                return res.redirect('/forum');
            })
    });
};

//function for creating a post
exports.createPost = (req, res, next) => {
    const topicId = req.params.topicId.slice(1);
    let imagePath = "images\\shop\\logo-yellow.jpeg";
    if (req.file) {
        imagePath = req.file.path;
    }
    request.post('http://localhost:8080/posts', {
        json: {
            title: req.body.title,
            content: req.body.content,
            imagePath: imagePath,
            creator: req.user.username,
            topicId: topicId
        }
    },
        function (err, response, body) {
            if (!err && response.statusCode == 201) {
                console.log(body);
            }
            return res.redirect('/posts/' + topicId);
        })
};

//function for deleting a post
exports.deletePost = (req, res, next) => {
    const db = getDbForum();
    const topicId = req.body.topicId;
    const postId = req.body.postId;
    var data = {
        postId: postId,
        topicId: topicId
    };
    const headers = {
        'Content-Type': 'application/json'
    };
    const options = {
        headers: headers,
        url: 'http://localhost:8080/posts/deletePost',
        method: "DELETE",
        json: data
    };
    db.collection('posts').findOne({ _id: ObjectId(postId) }).then(post => {
        fileHelper.deleteFile("public/" + post.imagePath);
        request(options,
            function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log(body);
                }
                return res.redirect('/posts/' + topicId);
            })
    });
};

//function for updating a post
exports.updatePost = (req, res, next) => {
    const db = getDbForum();
    const topicId = req.body.topicId;
    const postId = req.body.postId;
    const imagePath = req.file.path.replace('public\\', '');
    var data = {
        postId: postId,
        topicId: topicId,
        title: req.body.title,
        content: req.body.content,
        imagePath: imagePath,
        creator: req.body.creator
    };
    const headers = {
        'Content-Type': 'application/json'
    };
    const options = {
        headers: headers,
        url: 'http://localhost:8080/posts/updatePost',
        method: "PUT",
        json: data
    };
    db.collection('posts').findOne({ _id: ObjectId(postId) }).then(post => {
        fileHelper.deleteFile("public/" + post.imagePath);
        request(options,
            function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log(body);
                }
                return res.redirect('/posts/' + topicId);
            })
    });
};

//function for creating a comment in a post
exports.createComment = (req, res, next) => {
    const postId = req.params.postId;
    request.post('http://localhost:8080/comments', {
        json: {
            comment: req.body.comment,
            creatorId: req.user._id,
            postId: postId
        }
    },
        function (err, response, body) {
            if (!err && response.statusCode == 201) {
                console.log(body);
            }
            return res.redirect('/comments/' + postId);
        })
};

//function for deleting/updating a comment in a post
exports.HandleComments = (req, res, next) => {
    const postId = req.body.postId;
    const commentId = req.body.commentId;
    const method = req.body.method;
    console.log(req.body);
    const headers = {
        'Content-Type': 'application/json'
    };
    if (method === "Remove") {
        var data = {
            commentId: commentId,
            postId: postId
        };
        const options = {
            headers: headers,
            url: 'http://localhost:8080/comments/deleteComment',
            method: "DELETE",
            json: data
        };
        request(options,
            function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log(body);
                }
                return res.redirect('/comments/' + postId);
            })
    } else if (method === "Update") {
        const content = req.body.content;
        if (content === "") {
            return res.redirect('/comments/' + postId);
        }
        var data = {
        commentId: commentId,
        postId: postId,
        content: content
        };
        const options = {
            headers: headers,
            url: 'http://localhost:8080/comments/updateComment',
            method: "PUT",
            json: data
        };
        request(options,
            function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log(body);
                }
                return res.redirect('/comments/' + postId);
            })
    }
};

//Handler for post ratings (like/dislike)
exports.HandlePostRating = (req, res, next) => {
    let userId = req.body.userId;
    let method = req.body.method;
    let postId = req.body.postId;
    let topicId = req.body.topicId;
    let headers = {
        'Content-Type': 'application/json'
    };
    let post = {
        postId: postId,
        userId: userId
    };
    if (method === "Like") {
        let options = {
            headers: headers,
            url: 'http://localhost:8080/posts/likePost',
            method: "POST",
            json: post
        };
        request(options,
            function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log(body);
                }
                return res.redirect('/posts/' + topicId);
            })
    }
    else if (method === "Dislike") {
        let options = {
            headers: headers,
            url: 'http://localhost:8080/posts/dislikePost',
            method: "POST",
            json: post
        };
        request(options,
            function (err, response, body) {
                if (!err && response.statusCode == 200) {
                    console.log(body);
                }
                return res.redirect('/posts/' + topicId);
            })
    }
};

//Handler for product rating (1-5 stars)
exports.HandleProductRating = (req, res, next) => {
    const db = getDb();
    let userId = req.body.userId;
    let productId = req.body.productId;
    let productName = req.body.productName;
    let stars = req.body.rating;
    let headers = {
        'Content-Type': 'application/json'
    };
    let rating = {
        productId: productId,
        productName: productName,
        userId: userId,
        stars: stars
    };
    let options = {
        headers: headers,
        url: 'http://localhost:8080/rating/rateProduct',
        method: "POST",
        json: rating
    };
    request(options,
        function (err, response, body) {
            if (!err && response.statusCode == 201) {
                console.log(body);
            }
            db.collection('products').find().toArray().then(products => {
                products.forEach(product => {
                    let p = new Product(product.title, product.price, product.description, product.imagePath, product.rating, product._id);
                    p.UpdateRating();
                })
            }).then(result => {
                return res.redirect('/ratings');
            });
        })
};

//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------Functions not related to the API-------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------------------------------------------------//

//function for getting a user profile through topics/posts
exports.userProfile = (req, res, next) => {
    const username = req.body.creatorName;
    const db = getDb();
    db.collection('users').findOne({ username: username })
        .then(u => {
            let user = new User(u.username, u.email, u.password, u.cart, u._id, u.profilePicture, u.resetToken, u.resetTokenExpiration, u.role);
            if (u.role === "Moderator" || u.role === "Admin") {
                let moderator = new Moderator(user.username);
                moderator.getNumTopicsCreated().then(numTopics => {
                    user.getNumPostsCreated().then(numPosts => {
                        user.getLikes().then(numLikes => {
                            user.getDislikes().then(numDislikes => {
                                res.render('forum/userprofile', {
                                    path: '/userProfile',
                                    pageTitle: 'Fashlytical Profile',
                                    username: u.username,
                                    user: u,
                                    numPosts: numPosts,
                                    numTopics: numTopics,
                                    numLikes: numLikes,
                                    numDislikes: numDislikes
                                });
                            });
                        });
                    });
                });
            } else {
                user.getNumPostsCreated().then(numPosts => {
                    user.getLikes().then(numLikes => {
                        user.getDislikes().then(numDislikes => {
                            res.render('forum/userprofile', {
                                path: '/userProfile',
                                pageTitle: 'Fashlytical Profile',
                                username: u.username,
                                user: u,
                                numPosts: numPosts,
                                numLikes: numLikes,
                                numDislikes: numDislikes
                            });
                        });
                    });
                });
            }
        });
};

//Function for loading the user profile page
exports.getProfile = (req, res, next) => {
    if (req.user) {
        let username;
        if (req.user === undefined) {
            username = "User";
        } else {
            username = req.user.username;
        }
        if (req.user.role === "Moderator" || req.user.role === "Admin") {
            let moderator = new Moderator(req.user.username);
            moderator.getNumTopicsCreated().then(numTopics => {
                req.user.getNumPostsCreated().then(numPosts => {
                    req.user.getLikes().then(numLikes => {
                        req.user.getDislikes().then(numDislikes => {
                            res.render('forum/profile', {
                                path: '/profile',
                                pageTitle: 'Fashlytical Profile',
                                username: username,
                                user: req.user,
                                errorMessage: "",
                                numPosts: numPosts,
                                numTopics: numTopics,
                                numLikes: numLikes,
                                numDislikes: numDislikes
                            });
                        });
                    });
                });
            });
        } else {
            req.user.getNumPostsCreated().then(numPosts => {
                req.user.getLikes().then(numLikes => {
                    req.user.getDislikes().then(numDislikes => {
                        res.render('forum/profile', {
                            path: '/profile',
                            pageTitle: 'Fashlytical Profile',
                            username: username,
                            user: req.user,
                            errorMessage: "",
                            numPosts: numPosts,
                            numLikes: numLikes,
                            numDislikes: numDislikes
                        });
                    });
                });
            });
        }
    } else {
        res.redirect('/login');
    }
};

//Function for adding/updating the user's profile picture
exports.postAddProfilePic = (req, res, next) => {
    const db = getDb();
    const dbForum = getDbForum();
    const ProfilePic = req.file;
    if (ProfilePic === undefined) {
        let moderator = new Moderator(req.user.username);
        moderator.getNumTopicsCreated().then(numTopics => {
            req.user.getNumPostsCreated().then(numPosts => {
                req.user.getLikes().then(numLikes => {
                    req.user.getDislikes().then(numDislikes => {
                        res.render('forum/profile', {
                            path: '/profile',
                            pageTitle: 'Fashlytical Profile',
                            username: username,
                            user: req.user,
                            errorMessage: "No File Selected!",
                            numPosts: numPosts,
                            numTopics: numTopics,
                            numLikes: numLikes,
                            numDislikes: numDislikes
                        });
                    });
                });
            });
        });
    } else {
        const user = req.user;
        const imagePath = (ProfilePic.path).replace('public', '');
        let UpdatedUser = null;
        if (user.role === "User") {
            UpdatedUser = new User(
                user.username,
                user.email,
                user.password,
                user.cart,
                user._id,
                imagePath
            )
        } else if (user.role === "Moderator") {
            UpdatedUser = new Moderator(
                user.username,
                user.email,
                user.password,
                user.cart,
                user._id,
                imagePath
            )
        } else {
            UpdatedUser = new Admin(
                user.username,
                user.email,
                user.password,
                user.cart,
                user._id,
                imagePath
            )
        };
        if (!ProfilePic) {
            return res.status(422).render('forum/profile', {
                path: '/profile',
                pageTitle: 'Fashlytical Profile',
                errorMessage: 'Attached file is not an image!',
                username: username,
                user: req.user
            });
        }
        if (ProfilePic) {
            fileHelper.deleteFile("public" + req.user.profilePicture);
        };
        //Update the imagePath of all the comments which the user posted
        dbForum.collection('posts').find().toArray().then(posts => {
            posts.forEach(post => {
                for (let i = 0; i < post.comments.length; i++) {
                    if (post.comments[i].creator === req.user.username) {
                        post.comments[i].creatorImg = imagePath;
                    }
                }
                dbForum.collection('posts').updateOne({ _id: post._id }, { $set: { comments: post.comments } });
            });
        });
        //Update the user who changed his profile picture
        let moderator = new Moderator(req.user.username);
        moderator.getNumTopicsCreated().then(numTopics => {
            req.user.getNumPostsCreated().then(numPosts => {
                req.user.getLikes().then(numLikes => {
                    req.user.getDislikes().then(numDislikes => {
                        return db.collection('users')
                            .updateOne({ _id: user._id }, { $set: UpdatedUser })
                            .then(result => {
                                req.session.user = UpdatedUser;
                                req.user = UpdatedUser;
                                res.render('forum/profile', {
                                    path: '/profile',
                                    pageTitle: 'Fashlytical Profile',
                                    username: username,
                                    user: UpdatedUser,
                                    errorMessage: "",
                                    numPosts: numPosts,
                                    numTopics: numTopics,
                                    numLikes: numLikes,
                                    numDislikes: numDislikes
                                });
                            });
                    });
                });
            });
        });
    };
};

//Function for loading the staff page
exports.getStaff = (req, res, next) => {
    let username;
    if (req.user === undefined) {
        username = "User";
    } else {
        const db = getDbForum();
        username = req.user.username;
        db.collection('applications').findOne({ email: req.user.email }).then(pending => {
            if (pending !== null) {
                req.session.application_pending = true;
            } else if (pending === null) {
                req.session.application_pending = false;
            }
        });
    }
    User.getModerators().then(result => {
        res.render('forum/staff', {
            path: '/staff',
            pageTitle: 'Fashlytical Staff',
            username: username,
            user: req.user,
            moderators: result,
            pending: req.session.application_pending
        });
    });
};

//Function for sending a moderator application to the database
exports.postStaff = (req, res, next) => {
    const db = getDbForum();
    const message = req.body.application;
    let application = {
        message: message,
        username: req.user.username,
        email: req.user.email
    }
    return db.collection('applications').insertOne(application).then(result => {
        req.session.application_pending = true;
        res.redirect('/staff');
    });
};

//function for getting the update topic page
exports.getUpdateTopic = (req, res, next) => {
    const topicId = req.params.topicId;
    const db = getDbForum();
    db.collection('topics').findOne({ _id: ObjectId(topicId) }).then(topic => {
        res.render('forum/updateTopic', {
            path: '/updateTopic',
            pageTitle: 'Fashlytical Update Topic',
            topic: topic
        });
    });
};

//functino for getting the posts page
exports.getPosts = (req, res, next) => {
    var page = req.query.page ? req.query.page : 1;
    const topicId = req.params.topicId;
    const db = getDbForum();
    page = parseInt(page);
    if (page < 1) {
        page = 1;
    }
    let username;
    if (req.user === undefined) {
        username = "User";
    } else {
        username = req.user.username;
    }
    if (topicId.length > 24 || topicId.length < 24) {
            res.status(404).render('404', {
                pageTitle: 'Page Not Found',
                path: '/404'
            });
    } else {
        db.collection('topics').findOne({ _id: ObjectId(topicId) }).then(topic => {
            if (topic === null) {
                res.status(404).render('404', {
                    pageTitle: 'Page Not Found',
                    path: '/404'
                });
            } else {
                request('http://localhost:8080/posts',
                    {
                        json: {
                            topicId: topicId
                        }
                    },
                    function (err, response, body) {
                        if(page * 6 - body.totalPosts >= 6) {
                            page--;
                        } 
                        //Paginate posts
                        let posts = body.posts.slice((page - 1) * 6, page * 6);
                        if (response.statusCode == 200) {
                            return res.render('forum/posts', {
                                nextPage: parseInt(page) + 1,
                                previousPage: parseInt(page) - 1,
                                pageTitle: 'Fashlytical Posts',
                                path: '/posts',
                                username: username,
                                user: req.user,
                                topic: topic,
                                posts: posts,
                                number: (page - 1) * 6 + 1,
                                errorMessage: ""
                            })
                        } else {
                            console.log(err);
                        }
                });
            }
        });
    }
};

//function for getting the update post page
exports.getUpdatePost = (req, res, next) => {
    const topicId = req.params.topicId;
    const postId = req.params.postId;
    const db = getDbForum();
    db.collection('topics').findOne({ _id: ObjectId(topicId) }).then(topic => {
        db.collection('posts').findOne({ _id: ObjectId(postId) }).then(post => {
            res.render('forum/updatePost', {
                path: '/updatePost',
                pageTitle: 'Fashlytical Update Post',
                topic: topic,
                post: post
            });
        });
    });
};

//function for getting the comments page in a post
exports.getComments = (req, res, next) => {
    let username;
    if (req.user === undefined) {
        username = "User";
    } else {
        username = req.user.username;
    }
    const postId = req.params.postId;
    const db = getDbForum();
    let topicId = null;
    if (postId.length > 24 || postId.length < 24) {
            res.status(404).render('404', {
                pageTitle: 'Page Not Found',
                path: '/404'
            });
    } else {
        db.collection('topics').find().toArray().then(topics => {
            topics.forEach(topic => {
                topic.posts.forEach(post => {
                    if (post.postId.toString() === postId) {
                        topicId = topic._id;
                    }
                });
            });
            db.collection('posts').findOne({ _id: new ObjectId(postId) }).then(post => {
                if (post === null) {
                    res.status(404).render('404', {
                        pageTitle: 'Page Not Found',
                        path: '/404'
                    });
                } else {
                    res.render('forum/comments', {
                        path: '/comments',
                        pageTitle: 'Fashlytical Comments',
                        post: post,
                        topicId: topicId,
                        username: username
                    });
                }
            });
        });
    }
};

//function for getting the products and their ratings in the rate products topic
exports.getRatings = (req, res, next) => {
    let username;
    if (req.user === undefined) {
        username = "User";
    } else {
        username = req.user.username;
    }
    const db = getDb();
    let rated = [];
    db.collection('products').find().toArray().then(products => {
        db.collection('ratings').find().toArray().then(ratings => {
            if (req.user) {
                ratings.forEach(rating => {
                    if (req.user._id.toString() === rating.userId.toString()) {
                        rated.push({
                            productId: rating.productId,
                            rating: rating.stars
                        });
                    }
                });
            }
            res.render('forum/ratings', {
                path: '/ratings',
                pageTitle: 'Fashlytical Ratings',
                products: products,
                rated: rated,
                username: username
            });
        });
    });
};
