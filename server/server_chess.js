Array.prototype.remove=function(item){if(item instanceof Array){var item_string=item.toString();for(var i=0,len=this.length;i<len;i++){if(this[i].toString()===item_string){this.splice(i,1);return true}}return false}var index=this.indexOf(item);return index<0?false:this.splice(index,1)};
Array.prototype.add = function(item){return this.includes(item) ? () => {this.remove(item);this.push(item);} : this.push(item);};
Array.prototype.toggle = function(item){return this[this.includes(item) ? 'remove' : 'push'](item);};
Array.prototype.contains = Array.prototype.includes;
Array.prototype.includes_array=function(array,want_sort=false){var array_string=(want_sort?array.sort():array).toString();return this.some(v=>(want_sort?v.sort():v).toString()===array_string)};
Array.prototype.index_array=function(array,want_sort=false){var array_string=(want_sort?array.sort():array).toString();for(var i=0,len=this.length;i<len;i++){if((want_sort?this[i].sort():this[i]).toString()===array_string){return i}}return-1}

var {is_right_to_go,is_now_way_to_go} = require('./chess_game_rules');
function init_piece_pos(){
    var p = {
        'black':{},'red':{},
        'black_king_pos_string':'4,0',
        'red_king_pos_string':'4,9',
        'black_king_pos':[4,0],
        'red_king_pos':[4,9]
    };
    var l = ['car','horse','elephant','knight','king','knight','elephant','horse','car'];
    for(var i=0;i<=8;i++){
        p.black[`${i},0`] = l[i];
        p.red[`${i},9`] = l[i];
    }
    p.black['1,2'] = 
        p.black['7,2'] = 
        p.red['1,7'] = 
        p.red['7,7'] = 'gun';
    for(var i=0;i<=8;i+=2){
        p.black[`${i},3`] = 'soldier';
        p.red[`${i},6`] = 'soldier';
    }
    return p;
}

var server;

function Chess(socket_red,socket_black){
    console.log('初始化游戏','roomid',socket_red.roomid,socket_red.nickname,socket_black.nickname);
    var piece_pos = init_piece_pos(),
    game_data = {
        'player':{
            'red':              [socket_red.id,socket_red.nickname],
            'black':            [socket_black.id,socket_black.nickname]
        },
        'now_color':            'red',
        'round_count':          1,
        'game_status':          1,
        'roomid':               socket_red.roomid,
        'game_start_timestamp': new Date().getTime(),
        'game_over_timestamp':  0,
        'winner':'',
        'red_remnant_count':    16,
        'black_remnant_count':    16,
    };
    var last_data = null;           // 悔棋用
    var last_package_timestamp = 0; // 记录上个数据包的时间戳

    emit_all('game_start',{'player':game_data.player});    // 告诉所在在房间的客户端 '游戏开始'
    server.manage_room.set_room_game_status(game_data.roomid,1);                            // 将客户端所在房间标记为 '游戏中'
    

    // 客户端发送移动棋子数据包,服务端判断这步棋能否走.能就发送给所有人,不能就返回告诉客户端 '不能这样走'
    socket_on('can_move_piece',data => can_move_piece(data.identity === 'red' ? socket_red : socket_black,data));
    function can_move_piece(socket,data){
        if(data.identity === 'black'){ // 黑棋需要旋转矩阵
            rotation_matrix(data);
        }
        if(game_data.now_color !== data.identity){ // 判断现在是否轮到这个客户端下棋
            socket.emit(data.callback,{msg:`现在轮到${game_data.now_color}棋走`,succ:false});
            return false;
        }
        check_data(data);           // 检查客户端发来数据包,是否与服务端的相同
        var check_result = is_right_to_go(piece_pos,data);  // 判断数据包中棋子从坐标A移动到坐标B是否符合游戏规则
        // console.log('尝试移动棋子',data.identity,data.from.toString(),data.to.toString(),check_result);
        if(check_result === true){
            move_piece(data);       // 在服务器端的虚拟棋盘上移动棋子
            emit_move_piece(data);  // 将结果emit给在房间内的所有客户端
            switch_color();         // 切换颜色
        }else{
            // 行棋 不符合 游戏规则
            socket.emit(data.callback,{'msg':check_result.msg,'succ':false});
        }
    }
    // 旋转矩阵
    function rotation_matrix(data){
        console.log('rotation_matrix')
        data.from[0] = 8 - data.from[0];
        data.from[1] = 9 - data.from[1];
        data.to[0] = 8 - data.to[0];
        data.to[1] = 9 - data.to[1];
    }
    function move_piece(data){
        set_last_data(data);
        var from = data.from,
            to = data.to,
            from_color = data.from_color,
            to_color = data.to_color,
            to_is_empty = data.to_is_empty,
            from_string = from.toString(),
            to_string = to.toString();

        if(to_is_empty){                    // 棋子只是移动到某个空位置
            piece_pos[from_color][to_string] = piece_pos[from_color][from_string];
            delete piece_pos[from_color][from_string];
        }else if(to_color !== from_color){  // 棋子移动到某个位置并吃掉对方的一个棋子
            piece_pos[from_color][to_string] = piece_pos[from_color][from_string];
            delete piece_pos[from_color][from_string];
            delete piece_pos[to_color][to_string];
        }
        if(data.from_type === 'king'){ // 如果移动的棋子是 king ,则更新服务端的数据对象
            if(from_color === 'red'){
                piece_pos.red_king_pos_string = to_string;
                piece_pos.red_king_pos = Array.from(to);
            }else if(from_color === 'black'){
                piece_pos.black_king_pos_string = to_string;
                piece_pos.black_king_pos = Array.from(to);
            }
            console.log('更新king pos',piece_pos.black_king_pos_string,piece_pos.red_king_pos_string)
        }else{
            // 如果棋子移动到的位置与对方 king 重叠,则表明对方 king 已被吃,游戏结束
            if(to_string === piece_pos[`${from_color === 'red' ? 'black' : 'red'}_king_pos_string`]){
                emit_game_over(from_color === 'red' ? 21 : 11);
            }
        }
        game_data.round_count ++;
        game_data.red_remnant_count = Object.keys(piece_pos.red).length;
        game_data.black_remnant_count = Object.keys(piece_pos.black).length;
        // console.log('red 剩余棋子数',Object.keys(piece_pos.red).length,'black 剩余棋子数',Object.keys(piece_pos.black).length);
    }
    function emit_move_piece(data){
        var roomid = game_data.roomid;
        var rooms_list = server.manage_room.get_list();
        var room = rooms_list[roomid];
        for(var guest of room.who_inside.guest){
            server.io.sockets.sockets[guest[0]].emit('move_piece',data);
        }
        socket_emit(socket_red,'move_piece',data);
        data.from[0] = 8 - data.from[0];
        data.from[1] = 9 - data.from[1];
        data.to[0] = 8 - data.to[0];
        data.to[1] = 9 - data.to[1];
        socket_emit(socket_black,'move_piece',data);
    }

    // 申请悔棋
    socket_on('ask_for_regret',ask_for_regret);
    socket_on('answer_for_regret',answer_for_regret);
    function ask_for_regret(data){
        console.log('ask_for_regret')
        data.callback = 'answer_for_regret';
        var socket = data.identity === 'red' ? socket_black : socket_red;
        socket_emit(socket_black,'can_not_regret',false);
        socket_emit(socket_red,'can_not_regret',false);
        socket_emit(socket,'question_for_regret',data);
    }
    function answer_for_regret(data){
        console.log('answer_for_regret')
        if(data.answer === true){
            confirm_for_regret();
        }else if(data.answer === false){
            var socket = data.identity === 'red' ? socket_red : socket_black;
            socket_emit(socket,'regret_be_rejuect');
        }
    }
    function confirm_for_regret(){
        console.log(last_data)
        console.log('confirm_for_regret')
        game_data.round_count --;
        game_data.now_color = game_data.now_color === 'black' ? 'red' : 'black';
        var from = last_data.from,
            to = last_data.to,
            from_color = last_data.from_color,
            to_color = last_data.to_color,
            to_type = last_data.to_type,
            to_is_empty = last_data.to_is_empty,
            from_string = from.toString(),
            to_string = to.toString();
        
        if (to_is_empty) {
            piece_pos[from_color][from_string] = piece_pos[from_color][to_string];
            delete piece_pos[from_color][to_string];
        }else if(to_color !== from_color){
            piece_pos[from_color][from_string] = piece_pos[from_color][to_string];
            delete piece_pos[from_color][to_string];
            piece_pos[to_color][to_string] = to_type;
        }
        if(last_data.from_type === 'king'){
            if(from_color === 'red'){
                piece_pos.red_king_pos_string = from_string;
                piece_pos.red_king_pos = Array.from(from);
            }else if(from_color === 'black'){
                piece_pos.black_king_pos_string = from_string;
                piece_pos.black_king_pos = Array.from(from);
            }
        }
        game_data.red_remnant_count = Object.keys(piece_pos.red).length;
        game_data.black_remnant_count = Object.keys(piece_pos.black).length;
        // console.log('悔棋','red 剩余棋子数',Object.keys(piece_pos.red).length,'black 剩余棋子数',Object.keys(piece_pos.black).length);
        last_data = null;
        emit_all('update_game_data',{game_data,piece_pos});
    }
    // 申请和棋
    socket_on('ask_for_stalemate',ask_for_stalemate);
    socket_on('answer_for_stalemate',answer_for_stalemate);
    function ask_for_stalemate(data){
        console.log('ask_for_stalemate')
        data.callback = 'answer_for_stalemate';
        var socket = data.identity === 'red' ? socket_black : socket_red;
        socket_emit(socket,'question_for_stalemate',data);
    }
    function answer_for_stalemate(data){
        console.log('answer_for_stalemate')
        if(data.answer === true){
            var code = data.identity === 'red' ? 14 : 24;
            emit_game_over(code);
        }else if(data.answer === false){
            var socket = data.identity === 'red' ? socket_red : socket_black;
            socket_emit(socket,'stalemate_be_rejuect');
        }
    }
    // 投降
    socket_on('surrender',surrender);  
    function surrender(data){
        // {
        //     'identity':identity
        // }
        emit_game_over(data.identity === 'red' ? 15 : 25);
    }
    // 有人中途离开房间或断开连接
    socket_red.disconnect_or_leaveroom_when_gaming = function(){
        socket_red.disconnect_or_leaveroom_when_gaming = undefined;
        if(game_data.game_status === 1){
            emit_game_over(13);
        }
    };
    socket_black.disconnect_or_leaveroom_when_gaming = function(){
        socket_black.disconnect_or_leaveroom_when_gaming = undefined;
        if(game_data.game_status === 1){
            emit_game_over(23);
        }
    };

    // 客户端检测到下面的情况可能游戏出现胜负时触发此事件,服务端进行确认并判断:
    //     轮到一方行棋，但按规定，己方无棋可走；
    socket_on('check_game_over',check_game_over);
    function check_game_over(data){ 
        console.log('check_game_over')
        // {
        //     'identity':identity
        // }
        // 判断是否无棋可走
        if(is_now_way_to_go(piece_pos,data.identity)){
            emit_game_over(data.identity === 'red' ? 12 : 22);
        }

    }
    // 告诉房间内所有客户端,游戏已出胜负
    function emit_game_over(game_status){
        game_data.game_status = game_status;
        game_data.game_over_timestamp = new Date().getTime();
        game_data.winner = game_status > 10 && game_status < 20 ? 'black' : 'red';
        emit_all('game_over',game_data);
        // 移除所有事件监听器
        var evt_listeners = ['can_move_piece','regret','stalemate','surrender','check_game_over'];
        evt_listeners.forEach(evt => {
            socket_red.removeAllListeners(evt);
            socket_black.removeAllListeners(evt);
        });

        // 将房间标志为 '游戏结束'
        server.manage_room.set_room_game_status(game_data.roomid,2);

        // socket_red.game = socket_black.game = undefined;
    }



    function socket_emit(socket,evt,data){
        if(data === undefined){
            data = {};
        }
        if(!data instanceof Object || data instanceof Array){
            console.log('对象')
            debugger;
        }
        data.timestamp = new Date().getTime();
        console.log('socket_emit',socket === socket_black?'black':'red',evt,data.identity,data.timestamp)
        socket.emit(evt,data);
    }
    function socket_on(evt,callback){
        var fn = (data) => {
            console.log('socket_on',evt,data.identity,data.timestamp)
            if(!data instanceof Object || data instanceof Array){
                console.log('对象')
                debugger;
            }
            if (data.timestamp) {
                if (data.timestamp <= last_package_timestamp) {
                    console.log('收到过时或重复的包',evt,data.timestamp,last_package_timestamp,data);
                    return;
                }else{
                    last_package_timestamp = data.timestamp;
                }
            }else{
                console.log('没有时间戳',evt)
            }

            callback(data);
        };
        socket_black.on(evt,fn);
        socket_red.on(evt,fn);
    }
    // 将事件发送给房间内所有人
    function emit_all(evt,data){
        if(!data instanceof Object || data instanceof Array){
            console.log('对象')
            debugger;
        }
        var socket;
        if(socket_red.connected === true && socket_red.is_in_a_room === true){
            socket = socket_red;
        }else{
            socket = socket_black;
        }
        var roomid = socket.roomid;
        data.timestamp = new Date().getTime();
        console.log('emit_all',evt,data.identity,data.timestamp);
        socket.in(roomid).broadcast.emit(evt,data);
        socket.emit(evt,data);
    }

    // 检查客户端发来的游戏数据包,是否与服务端一样
    function check_data(data){
        // console.log('check_data',data)
        var check_result = true;
        if(data.from_type !== piece_pos[data.from_color][data.from.toString()]){
            console.error('!!! 检查客户端发来的游戏数据包出错','data.from',data);
            debugger;
            check_result = false;
        }
        //
        if(
            (data.to_is_empty === false && data.to_type === piece_pos[data.to_color][data.to.toString()] || data.to_is_empty === true)
        ){
            
        }else{
            console.error('!!! 检查客户端发来的游戏数据包出错','data.to',data);
            debugger;
            check_result = false;
        }
        //
        if(data.red_piece_count !== Object.keys(piece_pos.red).length || data.black_piece_count !== Object.keys(piece_pos.black).length){
            console.error('!!! 检查客户端发来的游戏数据包出错','棋子数量不对',data.red_piece_count,Object.keys(piece_pos.red).length,data.black_piece_count,Object.keys(piece_pos.black).length);
            debugger;
            check_result = false;
        }
        if(check_result === false){
            debugger;
            emit_all('update_game_data',{game_data,piece_pos});
        }
        return check_result;
    }

    function switch_color(){
        game_data.now_color = game_data.now_color === 'black' ? 'red' : 'black';
        emit_all('switch_color',{'now_color':game_data.now_color});
    }

    function set_last_data(obj){
        last_data = {};
        for(var key in obj){
            last_data[key] = obj[key];
        }
        last_data.from = Array.from(obj.from);
        last_data.to = Array.from(obj.to);
    }

    this.require_game_data = function(socket,data){
        if(game_data.game_status === 1){
            socket_emit(socket,'update_game_data',{game_data,piece_pos});
        }else{
            socket_emit(socket,data.callback,{
                'succ':false,
                'msg':'获取失败,游戏没在进行中'
            });
        }
    }
}
module.exports = function(ser){
    server = ser;
    global.chess_list = {};
    return function(socket_red,socket_black){
        var game = new Chess(socket_red,socket_black);
        global.chess_list[socket_red.roomid] = game;
    };
};

