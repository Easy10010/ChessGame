import Vue from 'vue';
import Vuex from 'vuex';
import event_bus from './event_bus';

// game_status :
// 0 游戏未开始,处于准备阶段
// 1 游戏进行中

// 11 red   将死       (red   输)
// 12 red   无子可走   (red   输)
// 13 red   中途离场   (red   输)
// 14 red   和棋       (red   输)
// 15 red   认输       (red   输)

// 21 black 将死       (black 输)
// 22 black 无子可走   (black 输)
// 23 black 中途离场   (black 输)
// 24 black 和棋       (black 输)
// 25 black 认输       (black 输)
// 
// 
// info = {
//     x,
//     y,
//     type = 'king',                   // 棋子类型
//     color = 'red',                   // 棋子颜色 red black
//     is_empty = false,                // 这个坐标的棋子是否为空位
//     tip_point_update_in_round:0,     // 在第几回合时更新的数据
//     
//     tip_point_all:[[0,0]],           // 按游戏规则所有能走的点
//     tip_point_right:[[0,0]]          // 所有能走的点,排除掉那些是队友的点
//     tip_point_to_eat:[[0,0]],        // 能走且可以吃对方的棋子
//     tip_point_to_be_eat:[[0,0]]      // 能走但会被对方吃的点
//     class = ['black','car']          // 该棋子的class
// }
// 
window.calc_tip_point_to_be_eat = true; // 是否显示走那个点会被吃
window.show_moved_trace = true;        // 是否显示 棋子移动过后的痕迹

Vue.use(Vuex);
const store = new Vuex.Store({
    state:{
        connecting:true,            // 是否连接中
        disconnect_count:0,         // 失去连接后.重连次数,超过一定次数,就不再重连
        online_user:0,              // 在线人数
        nickname:'',                // 昵称
        rooms_list:{},              // 房间列表
        chat_list:[],               // 聊天记录
        can_leave_room:false,       // 在房间内是否可以离开房间, false 为可以离开 , 其他情况就显示字符串警告
        in_a_room:false,            // 是否在房间内
        roomid:0,                   // 房间ID
        // game
        identity:null,              // 在房间内的身份 'red' 'black' 'guest'
        now_color:null,             // 现在轮到哪方下棋
        round_count: 1,             // 第几回合
        game_status: 0,             // 游戏状态

        chessboard:null,            // 虚拟棋盘,二维数组,vue根据该数组生成dom棋盘
        selecting_piece:false,      // 为 false 则表示当前没有选中的棋子; 或者为当前选中棋子的 info 对象

        black_piece_pos:[],         // 所有黑棋子的pos,二维数组   [ [0,0], [1,1] ]
        red_piece_pos:[],           // 所有红棋子的pos,二维数组   [ [0,0], [1,1] ]

        piece_tip_point:null,       // 棋子的 info 对象, dom棋盘上显示改棋子可行走的点

        moved_piece_trace:[],       // 棋子移动过后的痕迹 [ [0,0], [1,1] ]

        player:null,                // 房间内的player

        can_not_regret:false,
        can_not_stalemate:false,

        test:123,
    },
    mutations: {
        test(state){
            return state.test;
        },
        roomid(state,roomid){
            state.roomid = roomid;
        },
        reset_data(state){
            state.now_color = 'red';
            state.round_count = 1;
            state.game_status = 1;
            state.piece_tip_point = null;
            state.moved_piece_trace = [];
            state.selecting_piece = false;
            can_not_regret:false;
            state.can_regret_and_stalemate = false;
        },
        connecting(state,data){
            state.connecting = data;
        },
        disconnect_count(state){
            state.disconnect_count ++;
        },
        online_user(state,num){
            state.online_user = num;
        },
        nickname(state,data){
            state.nickname = data;
        },
        rooms_list(state,data){
            state.rooms_list = data;
        },
        chat_list(state,data){
            if (data.type === 'hr' && state.chat_list.length > 0 && state.chat_list[state.chat_list.length-1].type === 'hr') {
                return false;
            }
            state.chat_list.push(data);
        },
        in_a_room(state,data){
            state.in_a_room = data;
        },
        // game
        identity(state,color){
            state.identity = color;
        },
        now_color(state,color){
            state.now_color = color;
        },
        round_count(state,data){
            state.round_count = data;
        },
        round_count_increment(state){
            state.round_count ++;
        },
        game_status(state,data){
            state.game_status = data;
        },
        chessboard(state,data){
            state.chessboard = data;
        },
        selecting_piece(state,data){
            state.selecting_piece = data;
        },
        black_piece_pos(state,data){
            state.black_piece_pos = data;
        },
        red_piece_pos(state,data){
            state.red_piece_pos = data;
        },
        piece_tip_point(state,data){
            state.piece_tip_point = data;
        },
        moved_piece_trace(state,data){
            state.moved_piece_trace = data;
            event_bus.$emit('shwo_trace',data);
        },
        player(state,data){
            state.player = data;
        },
        can_leave_room(state,data){
            state.can_leave_room = data;  
        },
        can_regret_and_stalemate(state){
            state.can_not_stalemate = state.can_not_regret = true;
        },
        can_not_stalemate(state,bool){
            state.can_not_stalemate = bool;
        },
        can_not_regret(state,bool){
            state.can_not_regret = bool;
        }
    }
});
export default store;