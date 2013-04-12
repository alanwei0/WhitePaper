
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

io.set('heartbeat timeout' , 10);
io.set('heartbeat interval' , 4);

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



// var ServerManager = {
//     'io':{},
//     'initSocketIo':function(server){
//         this.io = require('socket.io').listen(server);
//         this.rooms = this.io.sockets.manager.rooms;
//         this.on();
//     },
//     'on':function(){
//         this.io.sockets.on('connection', function (socket) {
//             console.log('a new socket connected');

//             socket.on('predraw_req',function(data){
//                 socket.broadcast.emit('predraw_res',data);
//             });
//             socket.on('draw_req',function(data){
//                 socket.broadcast.emit('draw_res',data);
//             });
//             socket.on('clearcanvas_req',function(data){
//                 socket.broadcast.emit('clearcanvas_res');
//             });

//             socket.on('initcanvas_req',function(data){
//                 var res = initCanvas(data);
//                 socket.emit('initcanvas_res',res);
//             });

//             socket.on('loadRoomId',function(data){
//                 var res_data = makeRoomId();
//             });

//             socket.on('createRoom',function(data){
//                 var check_room = checkRoomId(data[0]);
//                 if(check_room[0]){
//                     var roomId = check_room[1];
//                 }else{
//                     callback(check_room);
//                 }

//                 var password = data[1];

//                 var check_creator = checkUsername(data[2]);
//                 if(check_creator[0]){
//                     var creator = check_creator[1];
//                 }else{
//                     callback(check_creator);
//                 }

//                 Controller.createRoom(data);
//             });

//             socket.on('joinRoom',function(data,callback){
//                 //call function in Controller
//                 //check 
//                 //search from the cache ,then database
//             });
//         });
//     },

//     'emit': function(){

//     },

//     'joinRoom': function(roomname){

//     },

//     'leaveRoom':function(roomname){

//     },

//     'checkRoomId': function(roomId){
//         if(!roomId) return [0,'roomId is null'];
//         if(roomId.match(/^\d+$/)) return [0,'roomId is illegal'];
//         if(MongoManager.roomExist(roomId)) return [0,'room is existed'];
//         return [1,roomId];
//     },

//     'checkUsername': function(name){
//         if(!name) return [0,'name is null'];
//         if(name.length > 20 ) return [0,'name is too long'];
//         return name;
//     },


// };


// var makeRoomId = function(){
//     var time = new Date();
//     time = time.getTime();
//     var result = (time-13131313)*13;
//     return result;
// };




// //the module in charge of manage room and canvas
// var Controller = {
//     'room_cache':[],
//     'roomCacheIsFull': (function(){
//         var that = this;
//         var room_cache_size = 1000;

//         return function(){
//             if(that.room_cache.length < room_cache_size) return false;
//             return true;
//         };
//     })(),
//     /**
//     *@desciption  create a new room
//     *@param {String} roomId, the id of the new room
//     *@param {String} roomPassword, the password of the new room
//     *@param {Socket} creator, creator's nickname
//     *@return null 
//     */
//     'createRoom': function(room){
//         if(!roomCacheIsFull){
//             room_cache.push(room);
//         }else{
//             this.newToCache(room);
//         }

//         MongoManager.addRoom(room);
        
//     },

//     'newToCache':function(newroom){
//         room_cache.shift();
//         room_cache.push(newroom);
//     },

//     /**
//     *@desciption  come in to a room
//     *@param {String} roomId, the id of the new room
//     *@param {String} roomPassword, the password of the new room
//     *@param {Socket} partner, partner's nickname
//     *@return null 
//     */
//     'comeInRoom': function(roomId, roomPassword, partner){

//     },

//     'leaveRoom': function(){

//     },

//     'backToRoom': function(){

//     },
// };

// //the module in charge of reading and writing the mongodb
// var MongoManager = {
//     'mongo':null,
//     'db':null,
//     'new_room':{},
//     'new_stroke_path':{},
//     'rooms':{},
//     'strokepath':{},
//     'init': function(host, port, name , server_options, db_options){
//         if(!this.db){
//             mongodb = require("mongodb");
//             var mongoserver = new mongodb.Server(host, port, server_options);
//             this.db = new mongodb.Db(name, mongoserver, db_options);
//             this.db.open(function(err,db){
//                 db.on("close", function(error){
//                     console.log("Connection to the database was closed!");
//                 });
//             });
//             this.rooms = this.db.collection('rooms');
//             this.strokepath = this.db.collection('strokepath');
//         }     
//     },

//     'setRoomSchema': function(){

//     },

//     'addRoom': function(room){
//         this.new_room._id = room[0];
//         this.new_room.password = room[1];
//         this.new_room.creator = room[2];
//         this.new_room.createTime = new Date();
//         this.rooms.insert(new_room, {'safe':true}, function(err, records){
//             if(err){
//                 console.log(err);
//             }else{
//                 console.log("Record added as "+records[0]._id);
//             }  
//         });
//     },

//     'roomExist': function(roomId){
//         var cursor = this.rooms.findOne({'_id': roomId}, function(err,doc){
            
//         });

//     },

//     'roomExistResult': function(err, doc){

//     },
// };

// //init the database
// MongoManager.init('172.0.0.1', 27017, 'whitepaper', {}, {'native_parser':true, 'strict':true});
