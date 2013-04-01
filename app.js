
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
    var MIN_HEIGHT = 400;
    var HEIGHT_WIDTH_PERCENT = 0.6;
    var MAX_WIDTH_PERCENT = 0.85;
    var height_percent = 0.7;
    var height = px.height;
    var width = px.width;
    var canvas_height;
    var canvas_width;

    while(1){
        canvas_height = height * height_percent;
        canvas_width = canvas_height/HEIGHT_WIDTH_PERCENT;
        if(canvas_width <= (width*MAX_WIDTH_PERCENT)){
            break;
        }else{
            height_percent = height_percent - 0.05;
        }
    }

    return [canvas_width,canvas_height];  
};

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

            socket.on('loadRoomId',function(data,callback){
                var res_data = makeRoomId();
                callback(res_data);
            });

            socket.on('createRoom',function(data,callback){
                Controller.createRoom(data);
                //then if cache isn't full, save in, nor to database
            });

            socket.on('joinRoom',function(data,callback){
                //call function in Controller
                //check 
                //search from the cache ,then database
            });
        });
    },

    'emit': function(){

    }


};


var makeRoomId = function(){
    var time = new Date();
    time = time.getTime();
    var result = (time-13131313)*13;
    return result;
};

//the module in charge of reading and writing the mongodb
var MongoManager = {
    'room':'',adfa
    'stroke_path':df''afa,
    'init': fuiofaafan(dbpath){
        v mongoaose =fafafaf require('mongoose');
        ifhis.f
            db = mongoose.connection;adfadfafa
            db.on('error', error.kjhgjgjhfgadfaffhgfbind(coadfadfadsfnsole, 'connection error:'));
            db.once('open', functioadfafn(){afda
                console.log('mongo connected!');
            });
        }dsfasdfasdfadsf
        mongoose.connectdsafdsafadsf(dbpath);
        setRoomSchema();

    },
    
    /*'room':'',
    'stroke_path':'',
    'init': function(dbpath){
        var mongoose = require('mongoose');
        if(!this.db){
            db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', function(){
                console.log('mongo connected!');
            });
        }
        mongoose.connect(dbpath);
        setRoomSchema();

    },*/

    'setRoomSchema': function(){
        var roomSchema = new Schema({
            'roomId': String,
            'password': String,
            'creator': String,
            'parter': String,
            'createTime':{type: Date, default: Date.now }
        });
        this.room = mongoose.model('Room',roomSchema);
    },

    'addRoom': function(room){
        
        this.room.
    },

    'setStrokePathSchema': function(){
        var strokePathSchema = new Schema({
        });
    },

    'addRoom': function(room){

    },
};


//the module in charge of manage room and canvas
var Controller = {
    'room_cache':[],
    'roomCacheIsFull': (function(){
        var that = this;
        var room_cache_size = 1000;

        return function(){
            if(that.room_cache.length < room_cache_size) return false;
            return true;
        };
    })(),
    /**
    *@desciption  create a new room
    *@param {String} roomId, the id of the new room
    *@param {String} roomPassword, the password of the new room
    *@param {Socket} socket_with_username, socket with creator's nickname as socket.userName
    *@return null 
    */
    'createRoom': function(roomId, roomPassword, socket_with_username){
        socket_with_username.join(roomId);  //join in a room

        var creator = socket_with_username.username;
        if(!roomCacheIsFull){
            room_cache.push([roomId,roomPassword,creator]);
        }

        var room = {
            'roomId': roomId,
            'roomPassword': roomPassword,
            'creator': creator
        }

        MongoManager.addRoom(room);
        
    },

    'newToCache':function(newroom){
        room_cache.shift();
        room_cache.push(newroom);
    },

    /**
    *@desciption  come in to a room
    *@param {String} roomId, the id of the new room
    *@param {String} roomPassword, the password of the new room
    *@param {Socket} socket_with_username, socket with creator's nickname as socket.userName
    *@return null 
    */
    'comeInRoom': function(roomId, roomPassword, socket_with_username){

    },

    'leaveRoom': function(){

    },

    'backToRoom': function(){

    },
};
