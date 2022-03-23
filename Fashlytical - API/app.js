//Importing all packages needed
const express = require('express');
const mongoConnectShop = require('./util/database').mongoConnectShop;
const mongoConnectForum = require('./util/database').mongoConnectForum;
const topicRoutes = require('./routes/topics');
const postRoutes = require('./routes/posts');
const app = express();

// Setting up the middleware
app.use(express.json({limit: "50mb"}));

// Setting up the middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Using the routes
app.use(topicRoutes);
app.use(postRoutes);

// Connecting to the databases
mongoConnectShop(() => {
    mongoConnectForum(() => {
        app.listen(8080);
    });
});