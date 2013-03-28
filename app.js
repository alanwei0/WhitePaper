
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



var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

io.sockets.on('connection', function (socket) {
    console.log('a new socket connected');

    socket.on('predraw_req',function(data){
        socket.broadcast.emit('predraw_res',data);
    });
    socket.on('draw_req',function(data){
        socket.broadcast.emit('draw_res',data);
    });
    socket.on('clearcanvas_req',function(data){
        socket.broadcast.emit('clearcanvas_res');
    });

    socket.on('initcanvas_req',function(data){
        var res = initCanvas(data);
        socket.emit('initcanvas_res',res);
    });

});

var initCanvas = function(px){
    var height = px.height;
    var width = px.width;
    var canvas_height;
    var canvas_width;
    for(var i=0;i<canvasSize.length;i++){
        if(width<=canvasSize[i][0]){
            continue;
        }else{
            canvas_height = canvasSize[i][1];
            canvas_width = canvasSize[i][0];
            break;
        }
    }
    return [canvas_width,canvas_height];  
};

var canvasSize =[
    [1500,840],
    [1000,560]   
];

var login = function(data){
    var username = data[0];
    var password = data[1];
};

var ServerManager = {
    'io':{},
    'initSocketIo':function(server){
        this.io = require('socket.io').listen(server);
        this.rooms = this.io.sockets.manager.rooms;
        this.on();
    },
    'on':function(){
        this.io.sockets.on('connection', function (socket) {
            console.log('a new socket connected');

            socket.on('predraw_req',function(data){
                socket.broadcast.emit('predraw_res',data);
            });
            socket.on('draw_req',function(data){
                socket.broadcast.emit('draw_res',data);
            });
            socket.on('clearcanvas_req',function(data){
                socket.broadcast.emit('clearcanvas_res');
            });

            socket.on('initcanvas_req',function(data){
                var res = initCanvas(data);
                socket.emit('initcanvas_res',res);
            });


            socket.on('checkroomname_req', function(roomName){
                Controller.checkRoomName(roomName);
            });

            socket.on('createroom_req',function(data){
                
            });

            socket.on('leaveroom_req',function(data){

            });
        });
    },

    'emit': function(){

    }


};

//the module in charge of manage room and canvas
var Controller = {

    'checkRoomName':function(roomName){

    },
    /**
    *@desciption  create a new room
    *@param {String} roomName, the name of the new room
    *@param {String} roomPassword, the password of the new room
    *@param {Socket} socket_with_username, socket with creator's nickname as socket.userName
    *@return null 
    */
    'createRoom': function(roomName, roomPassword, socket_with_username){

    },

    'comeInRoom': function(roomName, roomPassword, socket_with_username){

    },

    'leaveRoom': function(){

    },

    'backToRoom': function(){

    },
};

//the module in charge of reading and writing the mongodb
var MongoManager = {};
