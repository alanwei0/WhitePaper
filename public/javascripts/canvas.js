var LOCAL = 0;
var SERVER = 1;

//socketio module =====================
function Socket(){}

var socketio = {
	'_socket':null,
	'init':function(host){
	//host revolse
		if(!this._socket){
			this._socket = io.connect('http://' + host);
			this._socket.addTag = function(res){
				if(!res) res = {};
				res.data = SERVER;
				return res;
			};
		}
	}
};

Socket.prototype = socketio;
//======================================
var LoginSocket = new Socket();
LoginSocket.on = function(){

};

LoginSocket.emit = function(e, data, callback){
	this._socket.emit(e,data,callback);
};
//=======================================
var FriendSocket = new Socket();
FriendSocket.on = function(){

};
FriendSocket.emit = function(e,data){

};
//=======================================
var CanvasSocket = new Socket();

CanvasSocket.on = function(){
	this._socket.on('initcanvas_res',function(res){
		CanvasModel.initCanvas(res);
	});
	this._socket.on('predraw_res',function(res){
		res = this.addTag(res);
		CanvasModel.preDraw(res);
	});

	this._socket.on('draw_res',function(res){
		res = this.addTag(res);
		CanvasModel.draw(res);
	});

	this._socket.on('clearcanvas_res',function(res){
		CanvasModel.clearCanvas();
	});
	// this._socket.on('drawover_res',function(res){

	// });
	// this._socket.on('erase_res',function(res){

	// });
};

CanvasSocket.emit = function(e,data){
	switch(e){
		case 'initcanvas': this._socket.emit('initcanvas_req',data);break;
		case 'predraw':this._socket.emit('predraw_req',data);break;
		case 'draw': this._socket.emit('draw_req',data);break;
		case 'drawover':this._socket.emit('drawover_req',data);break;
		case 'erase': this._socket.emit('erase_req',data);break;
		case 'changestroke': this._socket.emit('changestroke_req',data);break;
		case 'clearcanvas':this._socket.emit('clearcanvas_req');break;
	};
};



//control module==============================
var Controller = {
	'canPaint': false,
	'clickOnEraser': function(e){

	},

	'downInCanvas':function(e){
		this.canPaint = true;
		CanvasModel.preDraw(e);
	},

	'moveInCanvas':function(e){
		if(!this.canPaint) return null; 
		CanvasModel.draw(e);
		
	},

	'mouseUp':function(e){
		this.canPaint = false;
	},

	'clickClearBtn':function(e){
		CanvasModel.clearCanvas();
	},
//---------------------------------------------------


	'CreateRoom':function(e){
		var roomId = e.data[0];
		var password = e.data[1];
		var username = e.data[2];
		var data = [roomid,password,username];
		LoginSocket.emit('createRoom',data,function(res_data){
			CreateRoomSucceed(res_data);
		});
	},

	'CreateRoomSucceed': function(succeed){
		if(succeed){
			LoginModel.fadeOut();
			//CanvasModel
		}else{
			LoginModel.showCreateError();
		}
	},

	//if succeed, the data will be [1,friend_name], otherwise, [0,error_data] 
	'JoinRoomSucceed': function(succeed){
		if(succeed[0]){
			LoginModel.fadeOut();
			//CanvasModel
		}else{
			LoginModel.showJoinError();
		}
	},

	'JoinRoom': function(e){
		var roomId = e.data[0];
		var password = e.data[1];
		var username = e.data[2];
		var data = [roomid,password,username];
		LoginSocket.emit('joinRoom',data,function(res_data){
			JoinRoomSucceed(res_data);
		});

	},

	'loadRoomId': function(){
		LoginSocket.emit('loadRoomId','',function(res_data){
			LoginModel.loadRoomId.call(LoginModel,res_data);
		});
	},
//--------------------------------------------------------



};
//model module=======================================
var CanvasModel = {
	'UNSET':-1,
	'context':null,
	'canvas':{'width':0,'height':0},
	'_local_pre_data':{'pre_x':this.UNSET,'pre_y':this.UNSET},
	'_server_pre_data':{'pre_x':this.UNSET,'pre_y':this.UNSET},
	
	'preDraw':function(e){
		if(e.data === LOCAL){
			var coord = $(e.target).offset();
			var rel_pos = this.getRelativePos(e.pageX - coord.left , e.pageY - coord.top);
			this._local_pre_data.pre_x = rel_pos[0];
			this._local_pre_data.pre_y = rel_pos[1];
			CanvasSocket.emit('predraw',
			{	
				'x':this._local_pre_data.pre_x,
				'y':this._local_pre_data.pre_y
			});
		}else if(e.data === SERVER){
			this._server_pre_data.pre_x = e.x;
			this._server_pre_data.pre_y = e.y;
		}

	},

	'draw':function(e){
		var now_x;
		var now_y; 
		var pre_x;
		var pre_y; 

		if(e.data === LOCAL){
			var coord = $(e.target).offset();

			now_x = e.pageX - coord.left;
			now_y = e.pageY - coord.top;

			var abs_pos = this.getAbsolutePos(this._local_pre_data.pre_x,this._local_pre_data.pre_y);
			pre_x = abs_pos[0];
			pre_y = abs_pos[1];
			var rel_pos = this.getRelativePos(now_x, now_y);
			this._local_pre_data.pre_x = rel_pos[0];
			this._local_pre_data.pre_y = rel_pos[1];
			CanvasSocket.emit('draw',
			{	
				'x':this._local_pre_data.pre_x,
				'y':this._local_pre_data.pre_y
			});
		}else if(e.data === SERVER){
			var now_abs_pos = this.getAbsolutePos(e.x,e.y);
			now_x = now_abs_pos[0];
			now_y = now_abs_pos[1];
			pre_abs_pos = this.getAbsolutePos(this._server_pre_data.pre_x , this._server_pre_data.pre_y);
			pre_x = pre_abs_pos[0];
			pre_y = pre_abs_pos[1];
			this._server_pre_data.pre_x = e.x;
			this._server_pre_data.pre_y = e.y;
		}

		this.context.beginPath();
		this.context.moveTo(pre_x,pre_y);
		this.context.lineTo(now_x,now_y);
		this.context.stroke();
	},

	'erase':function(e){

	},

	'changeStroke':function(e){

	},

	'clearCanvas':function(){
		this.context.clearRect(0,0,1000,500);
		//CanvasSocket.emit('clearcanvas');
	},

	'initCanvas':function(px){
		var canvas = $('#mycanvas')[0];
		canvas.height = px[1];
		canvas.width = px[0];
		this.canvas.width = canvas.width;
		this.canvas.height = canvas.height;
		this.context = canvas.getContext('2d');
		this.context.clearRect(0,0,px[0],px[1]);
	},

	'getAbsolutePos': function(rel_x,rel_y){
		var x = this.canvas.width * rel_x;
		var y = this.canvas.height * rel_y;
		return [x,y];
	},

	'getRelativePos': function(abs_x,abs_y){
		var rel_x = abs_x/this.canvas.width;
		var rel_y = abs_y/this.canvas.height;
		rel_x = rel_x.toFixed(6);
		rel_y = rel_y.toFixed(6);
		return [rel_x,rel_y];
	}
};

var LoginModel = {
	'_roomId':'',
	'username':'',
	'loadRoomId': function(roomId){
		this._roomId = roomId;
		//display to textinput, and set it disabled 
	},
	'showJoinError': function(error_data){

	},
	'fadeOut':function(){

	},
	'showCreateError': function(){

	},
};

var FriendModel = {

};

var getFormData = function(){
	//get roomid, password, username
}

//main================================================
$(document).ready(function(){
	socketio.init('localhost');
	CanvasSocket.on();

	//canvas
	//CanvasModel.context = $('#mycanvas')[0].getContext('2d');
	$('#mycanvas').bind('mousedown',LOCAL,$.proxy(Controller.downInCanvas,Controller));
	$('#mycanvas').bind('mousemove',LOCAL,$.proxy(Controller.moveInCanvas,Controller));
	$(document).bind('mouseup',LOCAL,$.proxy(Controller.mouseUp,Controller));

	//eraser
	//$('#myeraser').bind('click',Controller.clickEraser);

	//clear button
	//$('#clear_btn').bind('click',Controller.clickClearBtn);

	//LoginSocket.on();
	CanvasSocket.emit('initcanvas',{'width':screen.availWidth,'height':screen.availHeight});
	// $('#loginform').submit(function(e){
	// 	LoginController.login(e);
	// });

	


});

