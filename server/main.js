var io = require('socket.io');
var fs = require('fs');
var chess = require('./server_chess');
io = io.listen(8081);

// 使每次输出log时，都附带时间
console._log = console.log
console.log = (...args) => console._log(new Date().toLocaleString(), ...args)

console.log('Chess server start running ...');

var online_client_num = 0;
var random_nickname = new _random_nickname();
var manage_room = new _manage_room();
var fn = {
    'refesh_online_user':(socket) => {
        socket_emit_all(socket,'refesh_online_user',online_client_num);
    },
};
chess = chess({manage_room,io});
io.sockets.on('connection', function(socket) {
    online_client_num ++;
    socket.is_in_a_room = false;
    socket.roomid = 0;
    socket.nickname = '';
    console.log('new in: ',socket.id,'在线人数: ',online_client_num);

    // 告诉客户端已连接成功
    socket.emit('__connected');

    // 告诉所有客户端在线人数
    fn.refesh_online_user(socket);

    // 告诉客户端房间列表
    manage_room.update_client_room_list(socket);

    // 客户端 失去连接
    socket.on('disconnect', (data) => {
        online_client_num --;
        console.log(socket.nickname,'失去连接','在线人数: ',online_client_num);
        // 如果昵称是随机获得的,要收回
        random_nickname.giveBack(socket);
        // 退出房间
        manage_room.leave_room(socket,data);
        fn.refesh_online_user(socket);
    });

    // nickname
    socket.on('set_nickname',(data) => {
        random_nickname.giveBack(socket);
        console.log(socket.nickname,'设置昵称',data.nickname);
        socket.nickname = data.nickname;
    });
    socket.on('set_random_nickname',(callback) => {
        var yrld_nickname = socket.nickname;
        random_nickname.giveBack(socket);
        random_nickname.setName(socket);
        callback(socket.nickname);
        console.log(yrld_nickname,'设置随机昵称',socket.nickname);
    });

    // room
    socket.on('create_room',(data) => {
        manage_room.create_room(socket,data);
    });
    socket.on('enter_room',(data) => {
        manage_room.enter_room(socket,data);
    });
    socket.on('leave_room',(data) => {
        manage_room.leave_room(socket,data);
    });

    // msg
    socket.on('post_msg',(data) => { // 收到 有人发言 事件
        var roomid = manage_room.get_roomid(socket);
        if (!manage_room.is_in_a_room(socket)) {
            socket.emit(data.callback,'没在房间内');
            return false;
        }
        var getIdentity = (id) => {
            var list = manage_room.get_list();
            if(list[roomid].who_inside.red && list[roomid].who_inside.red[0] === id){
                return 'red';
            }else if(list[roomid].who_inside.black && list[roomid].who_inside.black[0] === id){
                return 'black';
            }
        };
        var msg_data = { // 触发客户端的 接受信息 事件
            'poster_nickname':socket.nickname, // 发言人昵称
            'poster_id':socket.id,             // 发言人id
            'msg':data.msg,                    // 发言人的信息
            'type':'msg',
            'identity':getIdentity(socket.id)
        };

        socket.in(roomid).broadcast.emit('recv_msg',msg_data);
        socket.emit('recv_msg',msg_data);
        console.log(socket.nickname,roomid,data.msg);
    });

    // test
    socket.on('code',(data) => {
        try{
            var r = eval(data.code);
            console.info(r);
        }catch(e){
            console.error(e);
            socket.emit(data.callback,'语法错误');
        }        
    });

    // game
    socket.on('ready',(data) => {
        if(!socket.is_in_a_room){
            socket.emit(data.callback,{msg:'没在任何房间内',succ:false});
            return false;
        }
        socket.ready = true;
        var t = manage_room.get_the_enemy_socket(socket);
        if(!t){ 
            return false;
        }
        var [enemy_socket,enemy_color] = t;
        if(enemy_socket.ready){
            if(enemy_color === 'black'){
                chess(socket,enemy_socket);
            }else{
                chess(enemy_socket,socket);
            }
        }
    });
    socket.on('unready',(data) => {
        if(!socket.is_in_a_room){
            socket.emit(data.callback,{msg:'没在任何房间内',succ:false});
            return false;
        }
        socket.ready = false;
    });
    socket.on('require_game_data',(data) => {
        if(!socket.is_in_a_room){
            socket.emit(data.callback,{
                'succ':false,
                'msg':'获取失败'
            });
            return false;
        }
        
        var game = global.chess_list[socket.roomid];
        game.require_game_data(socket,data);
        // var room = manage_room.get_list()[socket.roomid];
        // var red_socketid = room.who_inside.red[0];
        // var red_socket = io.sockets.sockets[red_socketid];

        // if(red_socket.disconnected === true || !red_socket.is_in_a_room){
        //     socket.emit(data.callback,{
        //         'succ':false,
        //         'msg':'获取失败'
        //     });
        //     return false;
        // }
        // red_socket.emit('require_game_data',(game_data) => {
        //     socket.emit(data.callback,game_data);
        // })
    });
});

function check_alive_num(socket){
    socket.broadcast.emit('is_alive');
    socket.on('i_am_alive',() => {
        console.log(socket.id,socket.nickname,'is alive');
    })
}
function socket_emit_all(socket,event_name,data){
    if(!socket) return false;
    socket.broadcast.emit(event_name,data);
    socket.emit(event_name,data);
}
function _random_nickname(){ // 随机分配昵称
    var random_nickname = require('./random_nickname.json');  
    var random_nickname_backup = random_nickname.slice(0);
    function GetRandomNum(Min,Max){var Range = Max - Min;var Rand = Math.random();return(Min + Math.round(Rand * Range));}
    this.setName = (socket) => {
        socket.nickname = this.getName();
    };
    this.getName = () => {
        if (random_nickname.length === 0) return 'undefined';
        // 按顺序
        return random_nickname.shift();
        // 随机
        // var random_index = GetRandomNum(0,random_nickname.length-1);
        // return random_nickname.splice(random_index,1)[0];
    };
    this.giveBack = (socket) => {
        if (socket.nickname) {
            if (random_nickname_backup.includes(socket.nickname) && !random_nickname.includes(socket.nickname)) {
                random_nickname.push(socket.nickname);
            }
        }
    };
}
function _manage_room(){
    var rooms_list = {}; 
    // roomid:{
    //     room_name:'',
    //     num:1,
    //     who_inside:{
    //         red:[id,nickname],
    //         black:[id,nickname],
    //         guest:[[id,nickname],[id,nickname]]
    //     },
    //     game_status:0 // 0 游戏未开始 1 游戏中 2 游戏结束
    // }
    
    this.get_roomid = (socket) => {
        return socket.roomid;
    };
    this.set_room_game_status = (roomid,game_status) => {
        rooms_list[roomid] && (rooms_list[roomid].game_status = game_status);
        this.update_client_room_list();
    };
    this.get_list = () => rooms_list;
    this.is_in_a_room = (socket) =>  socket.is_in_a_room;
    //this.update_client_room_list = (socket) => socket_emit_all(socket,'refesh_room_list',rooms_list);
    this.update_client_room_list = () => io.emit('refesh_room_list',rooms_list);
    this.create_room = (socket,data) => {
        if(socket.is_in_a_room){
            socket.emit(data.callback,{msg:'已经加入其它房间了',succ:false});
            return false;
        }

        var roomid = String(data.roomid);
        rooms_list[roomid] = {
            'room_name':data.room_name,
            'num':1,
            'who_inside':{
                'red':[socket.id,socket.nickname],
                'black':null,
                'guest':[]
            },
            'game_status':0
        };
        socket.join(roomid);
        socket.is_in_a_room = true;
        socket.roomid = roomid;
        // 告诉所有客户端更新房间列表
        this.update_client_room_list(socket);
        console.log('创建房间',socket.nickname,socket.id);
        socket.emit(data.callback,{'msg':'创建房间成功','succ':true,'identity':'red','room':rooms_list[roomid],'roomid':roomid});
    };
    this.enter_room = (socket,data) => {
        var roomid = String(data.roomid);
        if (rooms_list[roomid] === undefined) {
            socket.emit(data.callback,{msg:`${roomid} 的房间不存在`,succ:false});
            return false;
        }
        if (socket.is_in_a_room) {
            socket.emit(data.callback,{msg:'已经加入其它房间了',succ:false});
            console.error('bug');
            return false;
        }
        if(rooms_list[roomid].game_status === 2){
            socket.emit(data.callback,{msg:'游戏已经结束,无法进入房间',succ:false});
            return false;
        }
        socket.join(roomid);
        // 告诉其他人 xx 进入房间
        socket.in(roomid).broadcast.emit('someone_enter_room',{
            type:'system',
            msg:`${socket.nickname} 进入房间`
        });
        socket.is_in_a_room = true;
        socket.roomid = roomid;
        rooms_list[roomid].num ++;
        var identity;
        (() => { // 分配身份
            if(rooms_list[roomid].who_inside.red === null){
                rooms_list[roomid].who_inside.red = [socket.id,socket.nickname];
                identity = 'red';
            }else if(rooms_list[roomid].who_inside.black === null){
                rooms_list[roomid].who_inside.black = [socket.id,socket.nickname];
                identity = 'black';
            }else{
                rooms_list[roomid].who_inside.guest.push([socket.id,socket.nickname]);
                identity = 'guest';
            }
        })();
        console.log('进入房间',socket.nickname,socket.id);
        // 告诉所有客户端更新房间列表
        this.update_client_room_list(socket);
        socket.emit(data.callback,{'msg':'进入房间成功','succ':true,'identity':identity,'room':rooms_list[roomid],'roomid':roomid});
    };
    this.leave_room = (socket,data) => {
        if(!socket.is_in_a_room){
            socket.emit(data.callback,{msg:'没在任何房间内',succ:false});
            return false;
        }
        var roomid = String(socket.roomid);
        // 告诉其他人 xx 离开房间
        socket.in(roomid).broadcast.emit('someone_leave_room',{
            type:'system',
            msg:`${socket.nickname} 离开房间`
        });
        socket.leave(roomid);
        socket.is_in_a_room = false;
        socket.roomid = 0;
        rooms_list[roomid].num --;
        console.log('离开房间',socket.nickname,socket.id);
        if(rooms_list[roomid]){
            if (rooms_list[roomid].num === 0) {
                console.log('删除房间',rooms_list[roomid].room_name,rooms_list[roomid].num);
                delete rooms_list[roomid];
            }else{
                if(rooms_list[roomid].who_inside.red && rooms_list[roomid].who_inside.red[0] === socket.id){
                    rooms_list[roomid].who_inside.red = null;
                }else if(rooms_list[roomid].who_inside.black && rooms_list[roomid].who_inside.black[0] === socket.id){
                    rooms_list[roomid].who_inside.black = null;
                }else{
                    for (var i = rooms_list[roomid].who_inside.guest.length - 1; i >= 0; i--) {
                        if(rooms_list[roomid].who_inside.guest[i][0] === socket.id){
                            rooms_list[roomid].who_inside.guest.splice(i,1);
                            break;
                        }
                    }
                }
            }
        }

        socket.emit(data.callback,{msg:'离开房间成功',succ:true});
        // 告诉所有客户端更新房间列表
        this.update_client_room_list(socket);

        socket.disconnect_or_leaveroom_when_gaming && socket.disconnect_or_leaveroom_when_gaming();
    };
    this.get_the_enemy_socket = (socket) => {
        if (!socket.is_in_a_room || socket.roomid === 0 || rooms_list[socket.roomid].num < 2
            || !rooms_list[socket.roomid].who_inside.red || !rooms_list[socket.roomid].who_inside.black) {
            return false;
        }
        var enemy_socket_id,enemy_color,enemy_socket;
        if(rooms_list[socket.roomid].who_inside.red[0] === socket.id){
            enemy_socket_id = rooms_list[socket.roomid].who_inside.black[0];
            enemy_color = 'black';
        }
        if(rooms_list[socket.roomid].who_inside.black[0] === socket.id){
            enemy_socket_id = rooms_list[socket.roomid].who_inside.red[0];
            enemy_color = 'red';
        }
        enemy_socket = io.sockets.sockets[enemy_socket_id];
            
        return [enemy_socket,enemy_color];
    };
}
