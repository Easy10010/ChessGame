import Vue from 'vue'
import vuex from './vuex_store'
import client from './client'

import event_bus from './event_bus'

import calc_tip_point from './calc_tip_point'
import check_game_over from './check_game_over'

let socket = window.socket;
window.last_package_timestamp = 0;
window.last_package_evt;

function socket_on(evt,callback){
    socket.on(evt,(data) => {
        console.log('socket_on',evt,data);
        if (data.timestamp) {
            if (data.timestamp <= window.last_package_timestamp && evt === window.last_package_evt) {
                console.log('收到过时或重复的包',evt,data.timestamp,window.last_package_timestamp,data);
                return;
            }else{
                window.last_package_timestamp = data.timestamp;
                window.last_package_evt = evt;
            }
        }else{
            console.log('没有时间戳',evt)
        }
        callback(data);
    });
}
function socket_emit(arg) {
    let name = arg.name,callback = arg.callback;
    console.log('socket_emit',name);
    delete arg.name;
    callback && (arg.callback = name + '_callback');
    arg.timestamp = new Date().getTime();
    if(arg.console !== undefined){
        console.info(arg.console,arg);
        delete arg.console;
    }
    if (callback && !socket._callbacks[`$${name}_callback`]) {
        socket_on(name + '_callback',callback);
    }
    socket.emit(name,arg);
}


socket_on('game_start',(data) => {
    let player = data.player;
    let identity = vuex.state.identity;
    init_chessboard(identity);
    vuex.commit('player',player);
    vuex.commit('can_leave_room','游戏中,离开房间会被判定为输');
    vuex.commit('reset_data');
});
socket_on('switch_color', (data) => vuex.commit('now_color',data.now_color) );
event_bus.$on('try_move_piece',try_move_piece);
function try_move_piece(arg){ // 告诉服务器 要移动棋子
    let [from_info,to_info] = arg;
    socket_emit({
        name:'can_move_piece',
        callback(data){
            console.error(data);
            Vue.prototype.$message({
                type: 'error',
                message: data.msg
            });
        },
        'from':         [from_info.x,from_info.y],
        'to':           [to_info.x,to_info.y],
        'from_color':   from_info.color,
        'from_type':    from_info.type,
        'to_color':     to_info.color,
        'to_type':      to_info.type,
        'to_is_empty':  to_info.is_empty,
        'identity':     vuex.state.identity,
        'round_count':  vuex.state.round_count,
        'red_piece_count': vuex.state.red_piece_pos.length,
        'black_piece_count': vuex.state.black_piece_pos.length,
        'timestamp':    new Date().getTime(),

        'console':      '发送给服务器的数据包',
    });
}
socket_on('move_piece',(data) => {
    // console.log('来自服务器的数据包',data);
    if (vuex.state.game_status !== 1 && vuex.state.identity === 'guest') {
        require_game_data();
        return false;
    }

    //显示移动痕迹
    vuex.commit('moved_piece_trace',[[data.from[0],data.from[1]],[data.to[0],data.to[1]]]);

    let from_info = vuex.state.chessboard[data.from[1]][data.from[0]];
    from_info.class.remove('selecting'); // 取消选中的class
    
    let to_info = vuex.state.chessboard[data.to[1]][data.to[0]];
    event_bus.$emit('remove_tip_point');
    // 棋子移动 更新表
    let i = vuex.state[`${from_info.color}_piece_pos`].index_array(data.from);
    vuex.state[`${from_info.color}_piece_pos`][i] = data.to;
    if(!to_info.is_empty){ // 有棋子被吃
        vuex.state[`${to_info.color}_piece_pos`].remove(data.to);   // 删除这个被吃的棋子
        event_bus.$emit('sound_eat');

        to_info.type = to_info.color = null;
        to_info.is_empty = true;
        to_info.tip_point_update_in_round = 0;
        to_info.tip_point_all = to_info.tip_point_right = to_info.tip_point_to_eat = to_info.tip_point_to_be_eat = null;
        to_info.class = ['empty'];
        [from_info.x,to_info.x] = [to_info.x,from_info.x];
        [from_info.y,to_info.y] = [to_info.y,from_info.y];

        let temp = vuex.state.chessboard[data.from[1]][data.from[0]];
        vuex.state.chessboard[data.from[1]][data.from[0]] = vuex.state.chessboard[data.to[1]][data.to[0]];
        vuex.state.chessboard[data.to[1]][data.to[0]] = temp;
    }else{ // 只是普通的移动
        event_bus.$emit('sound_move');
        [from_info.x,to_info.x] = [to_info.x,from_info.x];
        [from_info.y,to_info.y] = [to_info.y,from_info.y];
        let temp = vuex.state.chessboard[data.from[1]][data.from[0]];
        vuex.state.chessboard[data.from[1]][data.from[0]] = vuex.state.chessboard[data.to[1]][data.to[0]];
        vuex.state.chessboard[data.to[1]][data.to[0]] = temp;
    }

    vuex.commit('selecting_piece',false);
    vuex.commit('round_count_increment');

    event_bus.$emit('calc_tip_point',[from_info,true,Array.from(data.from)]);
    event_bus.$emit('check_game_over');

    vuex.commit('can_regret_and_stalemate');
});
socket_on('game_over',(data) => {
    console.log('game_over',data);
    vuex.commit('can_leave_room',false);
    let h = window.vue.$createElement;
    let vnodes = h('gameover',{
        props:{
            'data':data,
            'identity':vuex.state.identity
        }
    });
    // let type = data.winner === vuex.state.identity ? 'success' : 'info';
    Vue.prototype.$msgbox({
        title: '游戏结束',
        message: vnodes,
        showCancelButton: false,
        confirmButtonText: '离开房间',
        cancelButtonText: '再来一局',
        // type,
        callback: (action, instance) => {
            if (action === 'cancel') {

            }else if(action === 'confirm'){
                event_bus.$emit('leave_room');
            }
        }
    })
});

function init_chessboard(identity,game_data_from_server){
    let top_color = 'black',bottom_color = 'red';
    if (identity === 'black') {
        top_color = 'red';
        bottom_color = 'black';
    }
    let init_config = {
        king:[
            [4,0],
            [4,9]
        ],
        car:[
            [0,0],[8,0],
            [0,9],[8,9]
        ],
        horse:[
            [1,0],[7,0],
            [1,9],[7,9]
        ],
        elephant:[
            [2,0],[6,0],
            [2,9],[6,9]
        ],
        knight:[
            [3,0],[5,0],
            [3,9],[5,9]
        ],
        gun:[
            [1,2],[7,2],
            [1,7],[7,7]
        ],
        soldier:[
            [0,3],[2,3],[4,3],[6,3],[8,3],
            [0,6],[2,6],[4,6],[6,6],[8,6]
        ]
    };

    let chessboard = fillArr();
    let black_piece_pos = [],red_piece_pos = [];
    if (game_data_from_server) {
        Object.keys(game_data_from_server.red).forEach((pos_string) => {
            let pos = pos_string.split(',');
            pos[0] = Number(pos[0]);
            pos[1] = Number(pos[1]);
            if (identity === 'black') {
                pos[0] = 8 - pos[0];
                pos[1] = 9 - pos[1];
            }
            set(game_data_from_server.red[pos_string],pos,'red');
        });
        Object.keys(game_data_from_server.black).forEach((pos_string) => {
            let pos = pos_string.split(',');
            pos[0] = Number(pos[0]);
            pos[1] = Number(pos[1]);
            if (identity === 'black') {
                pos[0] = 8 - pos[0];
                pos[1] = 9 - pos[1];
            }
            set(game_data_from_server.black[pos_string],pos,'black');
        });
        console.log('重更新');
    }else{
        Object.keys(init_config).forEach((piece_type) => {
            let value = init_config[piece_type];
            for(let pos of value){
                set(piece_type,pos);
            }
        });
    }
    function fillArr(){
        let p = [];
        for(let i = 0;i < 10;i ++){
            let arr = [];
            for(let j = 0;j < 9;j ++){
                arr.push({
                    x: j,
                    y: i,
                    type: null,
                    color: null,
                    tip_point_update_in_round:0,
                    tip_point_all:null,
                    tip_point_right:null,
                    tip_point_to_eat:null,
                    tip_point_to_be_eat:null,
                    class:['empty'],
                    is_empty: true
                });
            }
            p.push(arr);
        }
        return p;
    }
    function set(piece_type,pos,_color){
        let color = _color || (pos[1] < 5 ? top_color : bottom_color);
        let info = {
            x: pos[0],
            y: pos[1],
            type: piece_type,
            color: color,
            tip_point_update_in_round:0,
            tip_point_all:null,
            tip_point_right:null,
            tip_point_to_eat:null,
            tip_point_to_be_eat:null,
            class:[color,piece_type],
            is_empty: false,
        };
        chessboard[pos[1]][pos[0]] = info;
        (color === 'red' ? red_piece_pos : black_piece_pos).push(pos);
    }
    vuex.commit('chessboard',chessboard);
    vuex.commit('red_piece_pos',red_piece_pos);
    vuex.commit('black_piece_pos',black_piece_pos);
    console.log(chessboard,red_piece_pos,black_piece_pos)
    red_piece_pos.concat(black_piece_pos).forEach((pos) => {
        let info = chessboard[pos[1]][pos[0]];
        event_bus.$emit('calc_tip_point',[info]);
    });
}
socket_on('update_game_data',(data) => {
    let [game_data,piece_pos] = [data.game_data,data.piece_pos];
    console.log('update_game_data',[game_data,piece_pos]);
    vuex.commit('player',game_data.player);
    vuex.commit('now_color',game_data.now_color);
    vuex.commit('round_count',game_data.round_count);
    vuex.commit('game_status',game_data.game_status);
    vuex.commit('piece_tip_point',null);
    vuex.commit('moved_piece_trace',[]);
    vuex.commit('selecting_piece',false);
    vuex.commit('selecting_piece',false);
    vuex.commit('can_not_regret',false);
    init_chessboard(vuex.state.identity,piece_pos);
});
// 浏览器内部事件

// 认输
event_bus.$on('surrender',surrender);
function surrender(){
    socket_emit({
        'name':'surrender',
        'identity': vuex.state.identity
    });
}
// 请求和棋
event_bus.$on('ask_for_stalemate',ask_for_stalemate);
function ask_for_stalemate(){
    console.log('ask_for_stalemate')
    vuex.commit('can_not_stalemate',false);
    socket_emit({
        'name':'ask_for_stalemate',
        'identity': vuex.state.identity
    });
}
socket_on('question_for_stalemate',(data) => {
    Vue.prototype.$confirm('对方申请和棋', '提示', {
      confirmButtonText: '同意',
      cancelButtonText: '拒绝',
      type: 'info',
      callback:(action) => {
        socket_emit({
            'name':data.callback,
            'answer': (action === 'confirm' ? true : false),
            'identity': data.identity
        });
      }
    });
})
socket_on('stalemate_be_rejuect', (data) => {
    Vue.prototype.$message({
        type: 'error',
        message: '申请和棋的请求被拒绝'
    });
})
// 悔棋
event_bus.$on('ask_for_regret',ask_for_regret);
function ask_for_regret(){
    console.log('ask_for_regret')
    vuex.commit('can_not_regret',false);
    socket_emit({
        'name':'ask_for_regret',
        'identity': vuex.state.identity
    });
} 
socket_on('question_for_regret',(data) => {
    Vue.prototype.$confirm('对方申请悔棋', '提示', {
      confirmButtonText: '同意',
      cancelButtonText: '拒绝',
      type: 'info',
      callback:(action) => {
        socket_emit({
            'name':data.callback,
            'answer': (action === 'confirm' ? true : false),
            'identity': data.identity
        });
      }
    });
})
socket_on('regret_be_rejuect', (data) => {
    Vue.prototype.$message({
        type: 'error',
        message: '申请悔棋的请求被拒绝'
    });
})
event_bus.$on('can_not_regret',(bool) => {
    vuex.commit('can_not_regret',bool);
});




event_bus.$on('require_game_data',require_game_data);
function require_game_data(){
    socket_emit({
        name:'require_game_data',
        callback(data){
            console.log(data);
            if (data.succ === false) {
                Vue.prototype.$message({
                    type: 'error',
                    message: msg
                });
                return false;
            }
            vuex.commit('player',data.player);
            vuex.commit('now_color',data.now_color);
            vuex.commit('round_count',data.round_count);
            vuex.commit('game_status',data.game_status);
            vuex.commit('chessboard',data.chessboard);
            vuex.commit('red_piece_pos',data.red_piece_pos);
            vuex.commit('black_piece_pos',data.black_piece_pos);
            vuex.commit('piece_tip_point',null);
            vuex.commit('moved_piece_trace',[]);
            vuex.commit('selecting_piece',false);
            vuex.commit('can_not_regret',false);
            vuex.commit('can_not_stalemate',false);
        }
    })
}

event_bus.$on('del_game_data',() => {
    vuex.commit('can_leave_room',false);
    vuex.commit('identity',null);
    vuex.commit('now_color',null);
    vuex.commit('round_count', 1);
    vuex.commit('game_status', 0);
    vuex.commit('chessboard',null);
    vuex.commit('selecting_piece',false);
    vuex.commit('black_piece_pos',[]);
    vuex.commit('red_piece_pos',[]);
    vuex.commit('piece_tip_point',null);
    vuex.commit('moved_piece_trace',[]);
    vuex.commit('player',null);
    vuex.commit('can_not_regret',false);
    vuex.commit('can_not_stalemate',false);
});
event_bus.$on('set_ready',(is_ready) => {
    let name = is_ready ? 'ready' : 'unready';
    socket_emit({
        name,
        callback(data){
            if (!data.succ) {
                console.error(data.msg);
                Vue.prototype.$message({
                    type: 'error',
                    message: data.msg
                });
            }
        }
    });
});

// 要移动棋子
// 告知服务器
// 服务器 检查是否可移动
//  否 提示错误
// 服务器告知房间的所有客户端,移动棋子
