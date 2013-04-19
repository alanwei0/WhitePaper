var LOCAL = 0;
var SERVER = 1;

// socketio module =====================
function Socket(controller){
	this._socket;
	this.controller = controller;
	this.reqNumber = 0;
}

Socket.prototype.init = function(host){
	this._socket = io.connect('http://' + host);
};

Socket.prototype.on = function(){
	var self = this;

	this._socket.on('load_room_id_res' , function(res){
		self.controller.loadRoomId(res);
	});

	this._socket.on('create_room_res' , function(res){
		self.controller.createRoomRes(res);
	});

	this._socket.on('partner_into_room_req' , function(res){
		self.controller.partnerIntoRoom(res);
	});

	this._socket.on('partner_disconnect' , function(res){
		self.controller.partnerDisconnect(res);
	});

	// this._socket.on('partner_leave_room' , function(res){

	// });

	this._socket.on('join_room_res' , function(res){
		self.controller.joinRoomRes(res);
	});

	this._socket.on('canvas_res' , function(res){
		var res = self.splitData(res);
		self.controller.chooseAction(res);
	});

	this._socket.on('recover_res' , function(res){

	});

	this._socket.on('get_canvas_req' , function(req){

	});

	this._socket.on('reconnect' , function(){

	});

	this._socket.on('disconnect' , function(){

	});

	this._socket.on('reconnecting' , function(){

	});

	this._socket.on('reconnect_failed' , function(){

	});

	this._socket.on('chat_res' , function(res){
		controller.chat(SERVER , res);
	});


};

Socket.prototype.emit = function(e , data){
	this._socket.emit(e , data);
};

Socket.prototype.uploadCanvas = function(data){
	var self = this;
	var url = data.toString();
	console.log(url.length);
	var upload = function(){
		var chunk;
		if(url.length > 20000){
			chunk = url.slice(0,20000);
			url = url.slice(20000);
			var interval = setTimeout(upload , 1000);
		}else{
			chunk = '#end#' + url;
			if(interval) clearTimeout(interval);
		}
		self._socket.emit('upload_canvas' , chunk);
		
	};
	upload();
};

/**
*@description split SERVER data 
*@param {String} data is a String whose construction is 'type[&body]', body is real data
*@return {Array} [type , body]
*/
Socket.prototype.splitData = function(data){
	if(!data) return null;
	if(data.toString().length === 1) return [data , ''];
	var result = data.toString().match(/^(\d)&(.*)$/);
	if(result){
		var type = result[1];
		var data = result[2].toString().split('#');
		return [type , data];
	}
};


Socket.prototype.emitCanvasReq = function(type , data){
	this.reqNumber++;
	if(this.reqNumber > 500){
		self.controller.getCanvas();
		this.reqNumber = 0;
	}
	var req_data = this.packData(type , data);
	this._socket.emit('canvas_req' , req_data);
};

/**
*@description package local data
*@param {Int} type = LOCAL or SERVER
*@param {Array} data
*@return {String} type + & + data
*/
Socket.prototype.packData = function(type , data){
	if(!data || data.length < 1) return type;

	data = data.join('#');
	return type + '&' + data;
};



//control module=============================================
//===========================================================
//===========================================================
//===========================================================




function Controller(){
	this.canPaint = false;
	this.DOWN_IN_CANVAS = 0;
	this.MOVE_IN_CANVAS = 1;
	this.NEW_CANVAS = 2;
	this.ERASE = 3;
	this.DRAW = 4;
	this.CHANGE_STROKE = 5;
}

Controller.prototype.init = function(){
	this.socketIO = new Socket(this);
	this.socketIO.init('localhost');
	this.socketIO.on();
	this.loginModel = new LoginModel();
	//this.canvasModel = new CanvasModel();
};

// all functions' param 'e' is a {array}, which e[0] is 'from'(ex:LOCAL, SERVER), e[1] is 'body'(data) 
Controller.prototype.downInCanvas = function(e){
	var self = this;
	if( e[0] === LOCAL){
		self.canPaint = true;
		var res = self.canvasModel.preDraw(e);
		self.socketIO.emitCanvasReq(self.DOWN_IN_CANVAS , res);
	}else{
		self.canvasModel.preDraw(e);
	}
};

Controller.prototype.moveInCanvas = function(e){
	var self = this;
	if(e[0] === LOCAL){
		if(!self.canPaint) return null;
		var res = self.canvasModel.draw(e);
		self.socketIO.emitCanvasReq(self.MOVE_IN_CANVAS , res);
	}else{
		self.canvasModel.draw(e);
	}
	
	
};

Controller.prototype.erase = function(e){
	var self = this;
	if(e[0] === LOCAL){
		self.canvasModel.setType(LOCAL , 'erase');
		self.socketIO.emitCanvasReq(self.ERASE , '');
	}else{
		self.canvasModel.setType(SERVER , 'erase');
	}
};

Controller.prototype.draw = function(e){
	var self = this;
	if(e[0] === LOCAL){
		this.canvasModel.setType(LOCAL , 'draw');
		self.socketIO.emitCanvasReq(self.DRAW , '');
	}else{
		this.canvasModel.setType(SERVER , 'draw');
	}
};

Controller.prototype.mouseUp = function(e){
	this.canPaint = false;
};

Controller.prototype.newCanvas = function(e){
	var self = this;
	if(e[0] === LOCAL){
		self.canvasModel.newCanvas();
		self.socketIO.emitCanvasReq(self.NEW_CANVAS , '');
	}else{
		self.canvasModel.newCanvas();
	}
};

Controller.prototype.changeStroke = function(e){
	var self = this;
	if(e[0] === LOCAL){
		var res = self.canvasModel.changeStroke(e);
		self.socketIO.emitCanvasReq(self.CHANGE_STROKE , res);
	}else{
		self.canvasModel.changeStroke(e);
	}
};

/**
*@description this function get canvas data from SERVER and assign them to the proper handler, only SocketIO can call this function
*@param {Array} [from , [type , data]]   
*/
Controller.prototype.chooseAction = function(data){
	var self = this;
	var type = parseInt(data[0]);
	var body = data[1];
	switch(type){
		case 0: self.downInCanvas([SERVER , body]); break;
		case 1: self.moveInCanvas([SERVER , body]); break;
		case 2: self.newCanvas([SERVER , body]);break;
		case 3: self.erase([SERVER , body]);break;
		case 4: self.draw([SERVER , body]);break;
		case 5: self.changeStroke([SERVER , body]);break;
	};

};


// Controller.prototype.splitData = function(data){
// 	if(!data) return null;
// 	var result = data.toString().match(/^(1)&(\d)&(.*)$/);
// 	if(result){
// 		result.shift();
// 		return result;
// 	}
// };

// //from+type+body ==========================================this function should move to SocketIO
// Controller.prototype.packData = function(from , type , body){
// 	return from + '&' + type + '&' + body;
// };


Controller.prototype.getCanvas = function(){
	var canvas_data = this.canvasModel.getCanvas();
	this.socketIO.uploadCanvas(canvas_data);
};


Controller.prototype.loadRoomId = function(){
	if(arguments.length === 0){
		this.socketIO.emit('load_room_id_req' ,'');
	}else{
		this.loginModel.loadRoomId(arguments[0]);
	}
	
};


Controller.prototype.getRoomId = function(){
	return this.loginModel.getRoomId();
};


Controller.prototype.createRoom = function(formData){
	var valid_data = this.loginModel.createRoom(formData);
	if(valid_data){
		this.socketIO.emit('create_room_req' , formData);
	}
};

/**
*@description process the response of create room
*@param {Array} res [boolean , data]
*/
Controller.prototype.createRoomRes = function(res){
	var success = res[0];
	if(success){
		
		this.canvasModel = new CanvasModel();
		this.canvasModel.init(getCanvasElement() , '');
		this.roomModel = new RoomModel();
		this.roomModel.comeIn(res , this.loginModel.getUsername());
		bindCanvasEvent();
		showCanvasAnimation();
		

	}else{
		console.log(res);
	}
};


Controller.prototype.joinRoom = function(formData){
	var valid_data = this.loginModel.joinRoom(formData);
	if(valid_data){
		this.socketIO.emit('join_room_req' , formData);
	}
};


Controller.prototype.joinRoomRes = function(res){
	var success = res[0];
	if(success){
		var url = res[1][2];
		this.canvasModel = new CanvasModel();
		this.canvasModel.init(getCanvasElement() , url);
		this.roomModel = new RoomModel();
		this.roomModel.comeIn(res , this.loginModel.getUsername());
		bindCanvasEvent();
		showCanvasAnimation();
		
	}else{
		showRoomIdError(res[1]);
	}
};


Controller.prototype.partnerDisconnect = function(res){
	this.roomModel.partnerDisconnect(res);
};


Controller.prototype.partnerIntoRoom = function(res){
	this.roomModel.partnerIn(res);
};

Controller.prototype.save = function(){
	this.canvasModel.save();
};

Controller.prototype.leaveRoom = function(){
	this.roomModel = null;
	this.canvasModel = null;
	this.loginModel = new LoginModel();
	this.loadRoomId();
	showLoginPanelAnimation();
	clearChatList();
};

Controller.prototype.chat = function(from , data){
	this.roomModel.chat(from , data);
	if(from === LOCAL){
		this.socketIO.emit('chat_req', data);
	}
}



//CanvasModel    ===============================================
//==============================================================
//==============================================================
//==============================================================




function CanvasModel(){
	this.context;
	this.canvas = {'width':0,'height':0};
	this._local_pre_data = {
		'pre_x':-1,
		'pre_y':-1,
		'type':'draw',
		'strokeStyle': '#000',
		'lineWidth': 3,

	};
	this._server_pre_data = {
		'pre_x':-1 ,
		'pre_y':-1 ,
		'type': 'draw',
		'strokeStyle': '#000' ,
		'lineWidth': 3 ,
	};

	this.eraseState = {
		'strokeStyle':'#fff' ,
		'lineWidth': 30,
	};
}


CanvasModel.prototype.setType = function(from , type){
	if(from === LOCAL){
		this._local_pre_data.type = type;
	}else{
		this._server_pre_data.type = type;
	}
};


CanvasModel.prototype.init = function(canvas , url){
	this.canvas = canvas;
	this.context = this.canvas.getContext('2d');
	this.context.fillStyle = '#fff';
	if(url.length < 1){
		this.context.fillRect(0,0,900,520);
	}else{
		this.recoverCanvas(url);
	}
	
};


CanvasModel.prototype.preDraw = function(e){
	var from = parseInt(e[0]);
	var body = e[1];
	if(from === LOCAL){
		var coord = $(body.currentTarget).offset();
		this._local_pre_data.pre_x = body.pageX - coord.left;
		this._local_pre_data.pre_y = body.pageY - coord.top;
		return [this._local_pre_data.pre_x , this._local_pre_data.pre_y];
	}else if(from === SERVER){
		var x = body[0];
		var y = body[1];
		this._server_pre_data.pre_x = parseInt(x);
		this._server_pre_data.pre_y = parseInt(y);
		return null;
	}

};


CanvasModel.prototype.draw = function(e){
	var now_x;
	var now_y; 
	var pre_x;
	var pre_y; 
	

	var from = parseInt(e[0]);
	var body = e[1];
	if(from === LOCAL){
		var coord = $(body.currentTarget).offset();

		now_x = body.pageX - coord.left;
		now_y = body.pageY - coord.top;

		var abs_pos = [this._local_pre_data.pre_x,this._local_pre_data.pre_y];
		pre_x = abs_pos[0];
		pre_y = abs_pos[1];
		this._local_pre_data.pre_x = now_x;
		this._local_pre_data.pre_y = now_y;
		this.stroke(LOCAL , this._local_pre_data.type , [pre_x , pre_y] , [now_x , now_y]);
		return [this._local_pre_data.pre_x , this._local_pre_data.pre_y];

	}else if(from === SERVER){
		now_x = parseInt(body[0]);
		now_y = parseInt(body[1]);
		pre_x = this._server_pre_data.pre_x;
		pre_y = this._server_pre_data.pre_y;
		this._server_pre_data.pre_x = now_x;
		this._server_pre_data.pre_y = now_y;
		this.stroke(SERVER , this._server_pre_data.type , [pre_x , pre_y] , [now_x , now_y]);
		return null;
	}
};


CanvasModel.prototype.stroke = function(from , type , begin , end){//type = draw or erase
	this.restoreStroke(from , type);
	this.context.beginPath();
	this.context.moveTo(begin[0] , begin[1]);
	this.context.lineTo(end[0] , end[1]);
	this.context.lineCap="round";
	this.context.lineJoin="round";
	this.context.stroke();

};


CanvasModel.prototype.saveStroke = function(from , strokeStyle , lineWidth){
	if(from === LOCAL){
		this.context.strokeStyle = this._local_pre_data.strokeStyle;
		this.context.lineWidth = parseInt(this._local_pre_data.lineWidth);
	}else if(from === SERVER){
		this.context.strokeStyle = this._server_pre_data.strokeStyle;
		this.context.lineWidth = parseInt(this._server_pre_data.lineWidth);
	}
};


CanvasModel.prototype.restoreStroke = function(from , type){
	if(from === LOCAL && type === 'draw'){
		this.context.strokeStyle = this._local_pre_data.strokeStyle;
		this.context.lineWidth = this._local_pre_data.lineWidth;
	}else if(from === SERVER && type === 'draw'){
		this.context.strokeStyle = this._server_pre_data.strokeStyle;
		this.context.lineWidth = this._server_pre_data.lineWidth;
	}else{
		this.context.strokeStyle = this.eraseState.strokeStyle;
		this.context.lineWidth = this.eraseState.lineWidth;
	}
};


CanvasModel.prototype.getCanvas = function(){
	var dataURL = $('#mycanvas').get(0).toDataURL();
	return dataURL;
};


CanvasModel.prototype.recoverCanvas = function(url){
	var self = this;
	var img = $('<img></img>');
	img.attr('src' , url);
	img.load(function(){
		self.context.drawImage(img.get(0),0,0);
	});
};


CanvasModel.prototype.newCanvas = function(){
	this.context.clearRect(0,0,900,520);
};


CanvasModel.prototype.changeStroke = function(e){
	var from = e[0];
	if(from === LOCAL){
		this._local_pre_data.strokeStyle = e[1][0];
		this._local_pre_data.lineWidth = e[1][1];
	}else{
		this._server_pre_data.strokeStyle = e[1][0];
		this._server_pre_data.lineWidth = e[1][1];
	}
	return e.pop();
};

CanvasModel.prototype.save = function(){
	var url = this.getCanvas();
	addShot(url);
	infomationAnimation.showInformation('You can save the shot by right-click or dragging to your desktop');
};



//LoginModel
//========================================================================
//========================================================================
//========================================================================



function LoginModel(){
	this.roomId;
	this.password;
	this.username;

}


LoginModel.prototype.loadRoomId = function(roomId){
	this.roomId = roomId;
	$('#roomId').get(0).value = this.roomId;
};


LoginModel.prototype.getRoomId = function(){
	return this.roomId;
};

LoginModel.prototype.getUsername = function(){
	return this.username;
};


LoginModel.prototype.createRoom = function(formData){ 
	var roomId = formData[0];
	var password = formData[1];
	var username = formData[2];
	var roomId_valid = this.checkRoomId(1 , roomId);
	var password_valid = this.checkPassword(password);
	var username_valid = this.checkUsername(username);
	var valid = true;
	if(!roomId_valid[0]) {
		showRoomIdError(roomId_valid[1]);
		valid = false;
	}else{
		clearError($('.room_id'));
	}
	if(!password_valid[0]){
		showPasswordError(password_valid[1]);
		valid = false;
	}else{
		clearError($('.password'));
	}
	if(!username_valid[0]){
		showUsernameError(username_valid[1]);
		valid = false;
	}else{
		clearError($('.user_name'));
	}

	if(valid){
		this.username = username;
		return true;

	}else{
		return false;
	}
	

};


LoginModel.prototype.joinRoom = function(formData){
	var roomId = formData[0];
	var password = formData[1];
	var username = formData[2];
	var roomId_valid = this.checkRoomId(0 , roomId);
	var password_valid = this.checkPassword(password);
	var username_valid = this.checkUsername(username);
	var valid = true;
	if(!roomId_valid[0]) {
		showRoomIdError(roomId_valid[1]);
		valid = false;
	}else{
		clearError($('.room_id'));
	}
	if(!password_valid[0]){
		showPasswordError(password_valid[1]);
		valid = false;
	}else{
		clearError($('.password'));
	}
	if(!username_valid[0]){
		showUsernameError(username_valid[1]);
		valid = false;
	}else{
		clearError($('.user_name'));
	}

	if(valid){
		this.username = username;
		return true;

	}else{
		return false;
	}
};


LoginModel.prototype.checkRoomId = function(create , roomId){
	if(create){
		if(roomId !== this.roomId) return [0 , 'your bitch'];
	}
	roomId = roomId.toString();
    if(!roomId) return [0,'required'];
    if(!roomId.match(/^\w+$/)) return [0,'illegal'];
    return [1];
};


LoginModel.prototype.checkPassword = function(password){
	if(!password) return  [0, 'required'];
    if(password.length < 8) return [0 , 'too short'];
    return [1];
};


LoginModel.prototype.checkUsername = function(username){
	if(!username) return [0,'required'];
    if(username.length > 10 ) return [0,'too long'];
    return [1];
};




//RoomModel
//=====================================================================
//=====================================================================
//=====================================================================




function RoomModel(){
	this.roomId;
	this.me;
	this.you;
}


RoomModel.prototype.comeIn = function(data , me){
	this.roomId = data[1][0];
	var users = data[1][1];
	if( users instanceof Array && users.length === 2){
		if(users[0] === me){
			this.you = users[1];
		}else{
			this.you = users[0];
		}
		addPartnerAnimation(this.you);
	}
	this.me = me;
	comeInAnimation(this.me);
};


RoomModel.prototype.partnerIn = function(partner){
	this.you = partner;
	infomationAnimation.showInformation(partner + ' comes In!');
	addPartnerAnimation(partner);
	
};


RoomModel.prototype.partnerLeave = function(partner){
	if(!this.you) return;
	infomationAnimation.showInformation(partner + ' logouts!');
	removePartnerAnimation(partner);
};


RoomModel.prototype.partnerDisconnect = function(partner){
	if(!this.you) return;
	infomationAnimation.showInformation(partner + ' disconnects!');
	removePartnerAnimation(partner);
};

RoomModel.prototype.chat = function(from , data){
	addChatAnimation(from , data);
};


// RoomModel.prototype.isPartnerIn = function(partner){
// 	var i;
// 	partner = partner.toString();
// 	var users = this.users;
// 	for(i in users){
// 		if(partner === users[i]) return true;
// 	}
// 	return false;
// };



//  main    ============================================================
//======================================================================
//======================================================================
//======================================================================



var controller = new Controller();
controller.init();
controller.loadRoomId();

$(document).ready(function(){

	/**
	*event, transform of 'create' and 'join' button
	*/
	$('.selection_wrap').mouseenter(function(e){
		var t = e.currentTarget;
		var submit = $('.btn');
		submit.unbind();
		var roomId_area = $('#roomId').get(0);
		if(t.className.match(/create/)){
			roomId_area.value = controller.getRoomId();
			roomId_area.readOnly = true;
			roomId_area.style.color = 'rgb(145,210,165)';
			$('.room_id > .form_label').fadeOut(100);
			submit.bind('click' , function(){
				console.log('create');
				controller.createRoom(getFormData());//------------call createRoom functin
				//showCanvasAnimation();
			});
		}else{
			$('.room_id > .form_label').fadeIn(150);
			roomId_area.value = null;
			roomId_area.readOnly = false;
			roomId_area.style.color = '#fff';
			submit.bind('click' , function(){
				console.log('join');
				controller.joinRoom(getFormData());//--------------call joinRoom function
			});
		}
		$('.form_field').fadeIn(150);
	});

	/**
	* form item animation
	*/
	(function(){
		var password_focused = false;
		var username_focused = false;
		var roomId_focused = false;
		var form_field = $('.form_field');
		$('.password').focusin(function(){
			password_focused = true;
		});
		$('.user_name').focusin(function(){
			username_focused = true;
		});
		$('.room_id').focusin(function(){
			roomId_focused = true;
		});
		$('.password').focusout(function(){
			password_focused = false;
		});
		$('.user_name').focusout(function(){
			username_focused = false;
		});
		$('.room_id').focusout(function(){
			roomId_focused = false;
		});

		form_field.mouseleave(function(){
			if($('#roomId').get(0).readOnly && (password_focused || username_focused)) return;
			if(!$('#roomId').get(0).readOnly && (roomId_focused || password_focused || username_focused)) return;
			$(this).fadeOut(100 , function(){
				$('#main_side').focus(function(e){
					$(this).css('outline','none');
				});
				$('#main_side').focus();
			});
		});

		$('#login_mask').bind('click' , function(e){
			var coord = form_field.offset();
			if(e.pageX >= coord.left && e.pageX <= (coord.left + form_field.innerWidth()) &&
			   e.pageY >= coord.top && e.pageY <= (coord.top + form_field.innerHeight())){
				return;
			}else{
				form_field.fadeOut(100 , function(){
					$('#main_side').focus(function(e){
						$(this).css('outline','none');
					});
					$('#main_side').focus();
				});
			}
		});
	})();
	

	$('.room_id').bind('click' , function(){
		$('#roomiId').focusin();
		$('.room_id > .form_label').fadeOut(100);
		$('.room_id > .form_req').fadeOut(100);

	});

	$('#roomId').focusout(function(){
		if(this.value) return;
		$('.room_id > .form_label').fadeIn(150);
		$('.room_id > .form_req').fadeIn(150);
	});

	$('.password').bind('click' , function(){
		$('#password').focusin();
		$('.password > .form_label').fadeOut(100);
		$('.password > .form_req').fadeOut(100);
	});

	$('#password').focusout(function(){
		if(this.value) return;
		$('.password > .form_label').fadeIn(150);
		$('.password > .form_req').fadeIn(150);
	});

	$('.user_name').bind('click' , function(){
		$('#username').focusin();
		$('.user_name > .form_label').fadeOut(100);
		$('.user_name > .form_req').fadeOut(100);
	});

	$('#username').focusout(function(){
		if(this.value) return;
		$('.user_name > .form_label').fadeIn(150);
		$('.user_name > .form_req').fadeIn(150);
	});


	$('#newcanvas').click(function(){
		controller.newCanvas([LOCAL]);//------------------------call nowCanvas function
	});

	$('#logout').click(function(){
		controller.leaveRoom();//------------------------------call leaveRoom function
	});

	$('#chat_input input').keydown(function(e){
		if(e.which == 13 && this.value.length > 0){
			controller.chat(LOCAL , this.value);//-------------------------------call chat function
			this.value = '';
		}
	});

	$('#chat_input').click(function(){
		$(this).children('input').focus();
		$(this).children('span').fadeOut(100);
		
	});

	$('#chat_input input').focusout(function(){
		if(!this.value) $(this).parent().children('span').fadeIn(100);
	});




});




//Animations ==========================================================
//=====================================================================
//=====================================================================
//=====================================================================



/**
*@desciption class in charge of the tool-bar animation
*
*/
var toolAnimation = {
	'active':'pen',   // when you click some tool, it will be active, and attr 'active' points to the active elem

	/**
	*@description  bind event listener(animation) to tools 
	*/
	'init': function(){
		var self = this;
		var tool = $('.tool');
	

		tool.click(function(e){
			// if(self.active === ''){
			// 	self.active = e.currentTarget.id;
			// 	return;
			// }
			// if(self.active !== e.currentTarget.id){
			// 	var temp = self.active;
			// 	self.active = e.currentTarget.id;
			// 	$('#' + temp).mouseleave();
			// }
			if($(this).hasClass('active')) return;
			if($('.active').get(0)) $('.active').removeClass('active').mouseleave();
			$(this).addClass('active');
		});

		tool.mouseenter(function(e){
			// if(self.active === e.currentTarget.id) return;
			if($(this).hasClass('active')) return;
			var text = this.getElementsByTagName('div')[0];
			var img = this.getElementsByTagName('img')[0];
			$(img).fadeOut(100);
			$(text).fadeIn(150);

		});

		tool.mouseleave(function(e){
			//if(self.active === e.currentTarget.id) return;
			if($(this).hasClass('active')) return;
			var text = this.getElementsByTagName('div')[0];
			var img = this.getElementsByTagName('img')[0];		 
			$(text).fadeOut(100);
			$(img).fadeIn(150);
		});

		//======================================================
		var setting = $('#setting');
		setting.click(function(e){
			strokeSettingPanel.showPanel();
		});

		setting.mouseleave(function(e){
			if($(this).hasClass('active')) return;
			strokeSettingPanel.hidePanel();
		});
		//=======================================================
		(function(){
			var erase = $('#erase');
			var begin_erase = false;
			
			erase.click(function(){
				begin_erase = true;
			});

			$('.tool').click(function(){
				if(this !== $('#erase').get(0)) begin_erase = false;
			});

			erase.mouseleave(function(e){
				if($(this).hasClass('active')) return;
				$('.era').css('display' , 'none');
			});

			$('.canvas_eraser').mousemove(function(e){
				if(begin_erase){
					var eraser = $('.era');
					if(!mouseOutOfCanvas(e.pageX , e.pageY)){
						eraser.css('left' , e.pageX-18);
						eraser.css('top' , e.pageY-18);
						eraser.css('display' , 'inline-block');
					}else{
						eraser.css('display' , 'none');
					}
				}
			});
		})();
		//==================================================
		var clear = $('#newcanvas');
		clear.click(function(){
			if(!$(this).hasClass('active')) return;
			$(this).removeClass('active');
		});
		//==================================================
		$('#save').click(function(){
			if(!$(this).hasClass('active')) return;
			$(this).removeClass('active');
		});
		//==================================================

		$('#pen').mouseenter().click();

	},

	/**
	*@description set some tool(element) unactive, remember that don't call this function(and setActive()) for 'pen' and 'erase', because they can animate autoly 
	*@param {String} id is the 'id' attr of your selected tool, ex:'logout', 'newcanvas', 'save', 
	*/
	'setUnactive':function(id){
		$(this).removeClass('active');
		$('#' + id).mouseleave();
	},

	/**
	*@description set some tool(element) active
	*@param {String} id is the 'id' attr of your selected tool, ex:'logout', 'newcanvas', 'save'
	*/
	'setActive':function(id){
		$('#'+id).mouseenter().click();	
	},
};

/**
*@description get form data , include roomId, password, uername
*@return {Array} [roomId , password , username]
*/
var getFormData = function(){
	var roomId = $('#roomId').get(0).value;
	var password = $('#password').get(0).value;
	var username = $('#username').get(0).value;

	return [roomId , password , username];
};

var clearFormData = function(){
	$('#roomId').get(0).value = null;
	$('#password').get(0).value = null;
	$('#username').get(0).value = null;

};


/**
*@description show Canvas panel and hide login panel when you login successfully
*/
var showCanvasAnimation = function(){
	var loginPanel = $('#login_mask');
	var canvasPanel = $('#canvas_wrap');
	loginPanel.fadeOut(200);
	canvasPanel.fadeIn(200);
	toolAnimation.init();
	strokeSettingPanel.init();

};

/**
*@description converse function of upper one  
*/
var showLoginPanelAnimation = function(){
	clearFormData();
	var loginPanel = $('#login_mask');
	var canvasPanel = $('#canvas_wrap');
	canvasPanel.fadeOut(200);
	loginPanel.fadeIn(200 , function(){
		$('.form_label').fadeIn(150);
		$('.form_req').fadeIn(150);
	});
	
};



var showRoomIdError = function(error){
	showError($('.room_id') , error);
};

var showPasswordError = function(error){
	showError($('.password') , error);
};

var showUsernameError = function(error){
	showError($('.user_name') , error);
};

var showError = function(elem , error){
	elem.children('.form_input').addClass('error');
	elem.children('.form_error').html('<span>' + error + '</span>').fadeIn(150);
	elem.children('.form_req').fadeOut(100);

};

var clearError = function(elem){
	if(!elem.children('.form_input').hasClass('error')) return;
	elem.children('.form_input').removeClass('error');
	elem.children('.form_error').html('').css('display' , 'none');
	elem.children('.form_req').css('display' , 'block');
};


var comeInAnimation = function(user){
	var me = $('<div><span>' + user + '</span></div>').addClass('user me');
	me.css('display' , 'none');
	me.appendTo('.inner');
	me.fadeIn(200);
};


/**
*@description add partner's name to list 
*@param {Array} partners is the array of partner's name
*/
var addPartnerAnimation = function(partner){
	var you = $('<div><span>' + partner + '</span></div>').addClass('user partner');
	you.css('display' , 'none');
	you.appendTo('.inner');
	you.fadeIn(200);
};

/**
*@description converse function of upper one, but param is a string, not a array!
*@param {String} partner
*/
var removePartnerAnimation = function(){
	$('.partner').detach();
};

/**
*@desciption check if mouse is out of canvas
*@param {int} x is x-coord of mouse
*@param {int} y is y-corrd of mouse
*@return {boolean}
*/
var mouseOutOfCanvas = function(x , y){
	var canvas = $('.canvas_eraser');
	var coord = canvas.offset();
	if(x < coord.left || x > (coord.left+645)){
		return true;
	}
	if(y < coord.top || y > (coord.top+520)){
		return true;
	}
	return false;
};


var infomationAnimation = {
	'interval': {},
	'showInformation':function(info){
		clearTimeout(this.interval);
		var infomation = $('.infomation');
		infomation.html('<span>' + info + '</span>');
		var time = 0;
		var animation = function(){
			infomation.fadeIn(1500);
			infomation.fadeOut(2000);
			time++;
			if(time >= 4 ){
				clearTimeout(this.interval);
			}else{
				this.interval = setTimeout(animation , 20);
			}
		};
		animation();
	},
};


var showCanvasMask = function(info){

};

var hideCanvasMask = function(){

};

var getCanvasElement = function(){
	return $('canvas').get(0);
};


//Stroke Setting Panel==================================
//======================================================
//======================================================
//======================================================



var strokeSettingPanel = {
	'strokeStyle':'rgb(0,0,0)',
	'lineWidth':3,

	'init':function(){
		this.panel = $('.stroke_panel');
		this.color_selector = $('#color_selector');
		this.line_width_slider = $('#line_width_slider');
		this.range = $('#range');
		this.now_width = $('#now_width span');
		this.now_width.html(3);
		this.activeDiv;

		var self = this;

		(function(){
			var red;
			var green;
			var blue;
			var index = 0;
			for(red = 50 ; red <= 200 ; red += 50){
				for(green = 50 ; green <= 200 ; green += 50){
					for(blue = 50 ; blue <= 200 ; blue += 50){
						var color_div = $('<div></div>');
						color_div.attr('class' , 'color_div');
						var color = 'rgb(' + red + ',' + green + ',' + blue + ')';
						if(index === 0){
							color = 'rgb(0,0,0)';
							color_div.css('outline' , '2px solid #000');
							color_div.css('background-color' , color);
							self.activeDiv = color_div;
						}
						
						color_div.css('background-color' , color);
						color_div.appendTo(self.color_selector);
						index++;
					}
				}
			}
		})();

		self.color_selector.bind('click' , function(e){
			var temp = self.activeDiv;
			temp.css('outline' , 'none');
			var elem = e.target;
			self.activeDiv = $(elem);
			if(elem === this) return;
			var all_elems = this.getElementsByTagName('div');
			var i;
			for(i in all_elems){
				if(all_elems[i] === elem) break;
			}
			self.strokeStyle = self.index2color(i);
			$(elem).css('outline' , '2px solid ' + self.strokeStyle);
		});

		(function(){
			var state = 0;
			var min_width = 3;
			var distance = 105;
			var left = self.range.offset().left;
			self.line_width_slider.bind('mousedown' , function(){
				state = 1;
			});

			self.line_width_slider.bind('click' , function(e){
				e.preventDefault();
				var now_left = e.pageX - left - 6;
				if(now_left > (distance - 6)) now_left = distance - 6;
				if(now_left < -6 ) now_left = -6;
				self.range.css('left' , now_left);
				self.lineWidth = 3 + Math.floor((now_left + 6)/distance/5*100);
				self.now_width.html(self.lineWidth);
			});

			$(document).bind('mousemove' , function(e){
				if(state === 1){
					e.preventDefault();
					var now_left = e.pageX - left - 6;
	 				if(now_left > (distance - 6)) now_left = distance - 6;
	 				if(now_left < -6 ) now_left = -6;
	 				self.range.css('left' , now_left);
	 				self.lineWidth = 3 + Math.floor((now_left + 6)/distance/5*100);
	 				self.now_width.html(self.lineWidth);
				}
				
			});

			$(document).bind('mouseup' , function(){
				state = 0;
			});
		})();

		this.panel.css('display' , 'none');		
	},

	'showPanel':function(){
		var isHide = this.panel.css('display');
		if(isHide !== 'none') return;
		this.panel.fadeIn(100);
	},

	'hidePanel':function(){
		var isHide = this.panel.css('display');
		if(isHide === 'none') return;
		this.panel.fadeOut(100);
	},

	'index2color':function(index){
		var res_arr = [];
		while(index >= 4){
			var mod = index % 4;
			res_arr.push(mod);
			index = Math.floor(index / 4);
		}
		res_arr.push(index);
		res_arr[2] = res_arr[2] || 0;
		res_arr[1] = res_arr[1] || 0;
		var red = (res_arr[2]+1)*50;
		var green = (res_arr[1]+1)*50;
		var blue = (res_arr[0]+1)*50;
		var color = 'rgb(' + red + ',' + green + ',' + blue + ')';
		return color;
	},


	'getStroke':function(){
		return [this.strokeStyle , this.lineWidth];
	},
};


var bindCanvasEvent = function(){
	var canvas_eraser = $('.canvas_eraser');
	$('#erase').click(function(){
		if($(this).hasClass('active')) return;
		controller.erase([LOCAL]); //-----------------------call erase function
	});

	$('#pen').click(function(){
		if($(this).hasClass('active')) return;
		controller.draw([LOCAL]);//--------------------------call draw function 
	});

	$('#setting').mouseleave(function(){
		if($(this).hasClass('active')) return;
		controller.changeStroke([LOCAL , strokeSettingPanel.getStroke()]);
	});

	canvas_eraser.mousedown(function(e){
		controller.downInCanvas([LOCAL,e]);//-------------- call downInCanvas function
	});

	canvas_eraser.mousemove(function(e){
		controller.moveInCanvas([LOCAL,e]);//---------call moveInCanvas function
		
	});


	$(document).mouseup(function(e){
		controller.mouseUp([LOCAL,e]);//-------------------call mouseup function
	});

	$('#save').click(function(){
		controller.save();
	});

};


var addShot = function(url){
	var img = $('#shot');
	if(!img.get(0)){
		img = $('<img></img>');
		img.attr('id' , 'shot');
	}
	
	img.attr('src' , url);
	img.css('display' , 'none');
	img.appendTo('.inner');
	img.load(function(){
		img.fadeIn('slow');
	});
	
};


var addChatAnimation = function(from , data){
	var chat_list = $('#chat_list');
	var new_item = $('<li></li>').addClass('chat_item');
	new_item.html('<span>' + data + '</span');

	if(from === LOCAL){
		new_item.css('background-color' , 'rgb(45,150,125)');
		
	}else{
		new_item.css('background-color' , 'rgb(145,210,165)');
	}
	new_item.prependTo(chat_list);
	new_item.animate({'margin-top' : '10px'});

};

var clearChatList = function(){
	$('#chat_list').empty();
};

