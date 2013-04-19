
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

//route
app.get('/', routes.index);
app.get('/client',user.client);
app.get('/fuck',user.fuck);

//=============================================

var Controller = require('Controller');
var MongoManager = require('MongoManager');
var SocketManager = require('SocketManager');
var EventManager = require('EventManager');

var mongodb = new MongoManager();
var eventManager = new EventManager();
var socketManager = new SocketManager();
var controller = new Controller();

var server = http.createServer(app);
server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

mongodb.init('127.0.0.1', 27017, 'whitepaper', {}, {w:-1});
socketManager.init(server , eventManager);
controller.init(mongodb , eventManager);
