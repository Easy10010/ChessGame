import vuex from './vuex_store'
import event_bus from './event_bus'

let socket = window.socket;
event_bus.$on('check_game_over',check_game_over);
function check_game_over(){
    let identity = vuex.state.identity;
    if (identity !== 'red' && identity !== 'black') return;
    let my_picee_pos = vuex.state[`${identity}_piece_pos`],
        // enemy_piece_pos = vuex.state[`${identity === 'red' ? 'black' : 'red'}_piece_pos`],
        chessboard = vuex.state.chessboard;
    let is_no_way_to_go = ! my_picee_pos.some((pos) => {
        let tip_point_right = chessboard[pos[1]][pos[0]].tip_point_right;
        return (tip_point_right instanceof Array && tip_point_right.length > 0) ? true : false;
    });
    // 无棋可走
    if (is_no_way_to_go) {
        console.log('check_game_over',identity)
        socket.emit('check_game_over',{
            'identity':identity
        });
    }
}