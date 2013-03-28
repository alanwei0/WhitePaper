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
	this._socket.on('loginsucceed_res',function(res){
		LoginController.loginSucceed(res);
	});
	this._socket.on('loginfailed_res',function(res){
		LoginController.loginFailed(res);
	});

};
LoginSocket.emit = function(e,data){
	switch(e){
		case 'login':this._socket.emit('login_req',data);break;
		
	};
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
var CanvasController = {
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
	}



};
//--------------------------------------------------
var LoginController = {
	'login':function(e){
		LoginSocket.emit('login',[e.target.username,e.target.password]);
	},
	'loginSucceed':function(e){

	},
	'loginFailed':function(e){

	}


};

var FriendController = {

};


//model module=======================================
var CanvasModel = {
	'UNSET':-1,
	'context':null,
	'_local_pre_data':{'pre_x':this.UNSET,'pre_y':this.UNSET},
	'_server_pre_data':{'pre_x':this.UNSET,'pre_y':this.UNSET},
	
	'preDraw':function(e){
		if(e.data === LOCAL){
			var coord = $(e.target).offset();
			this._local_pre_data.pre_x = e.pageX - coord.left;
			this._local_pre_data.pre_y = e.pageY - coord.top; 
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
			pre_x = this._local_pre_data.pre_x;
			pre_y = this._local_pre_data.pre_y;
			this._local_pre_data.pre_x = now_x;
			this._local_pre_data.pre_y = now_y;
			CanvasSocket.emit('draw',
			{	
				'x':now_x,
				'y':now_y
			});
		}else if(e.data === SERVER){
			now_x = e.x;
			now_y = e.y;
			pre_x = this._server_pre_data.pre_x;
			pre_y = this._server_pre_data.pre_y;
			this._server_pre_data.pre_x = now_x;
			this._server_pre_data.pre_y = now_y;
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
		this.context = canvas.getContext('2d');
		this.context.clearRect(0,0,px[0],px[1]);
	}
};

var LoginModel = {
	'username':'',
	'login':function(){

	}
};

var FriendModel = {

};

//main================================================
$(document).ready(function(){
	socketio.init('172.23.240.129');
	CanvasSocket.on();

	//canvas
	//CanvasModel.context = $('#mycanvas')[0].getContext('2d');
	$('#mycanvas').bind('mousedown',LOCAL,$.proxy(CanvasController.downInCanvas,CanvasController));
	$('#mycanvas').bind('mousemove',LOCAL,$.proxy(CanvasController.moveInCanvas,CanvasController));
	$(document).bind('mouseup',LOCAL,$.proxy(CanvasController.mouseUp,CanvasController));

	//eraser
	$('#myeraser').bind('click',CanvasController.clickEraser);

	//clear button
	$('#clear_btn').bind('click',CanvasController.clickClearBtn);

	LoginSocket.on();
	LoginSocket.emit('initcanvas',{'width':screen.availWidth,'height':screen.availHeight});
	$('#loginform').submit(function(e){
		LoginController.login(e);
	});


});

