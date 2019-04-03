import vuex from './vuex_store';
import event_bus from './event_bus';

let calc_tip_point;
event_bus.$on('calc_tip_point',([arg1,arg2,arg3]) => {
    calc_tip_point.entry(arg1,arg2,arg3)
});
event_bus.$on('remove_tip_point',remove_tip_point);
event_bus.$on('show_tip_point',show_tip_point);
function remove_tip_point(){
    vuex.commit('piece_tip_point',null);
}
function show_tip_point(info){
    if (!info.is_empty) {
        if (vuex.state.piece_tip_point !== info) {
            calc_tip_point.entry(info);
            vuex.commit('piece_tip_point',info);
        }        
    }else{
        vuex.commit('piece_tip_point',null);
    }
}
    

// 根据不同棋子类型+棋子位置 计算出棋子能走的路
calc_tip_point = {
    chessboard:null,
    black_piece_pos:null,
    red_piece_pos:null,
    info:null,
    entry(info,update_after_move = false,pos2){
        if(info.is_empty || info.tip_point_update_in_round === vuex.state.round_count) return;
        // console.log('计算点 calc_tip_point')
        this.info = info;
        this.chessboard = vuex.state.chessboard;
        this.black_piece_pos = vuex.state.black_piece_pos;
        this.red_piece_pos = vuex.state.red_piece_pos;

        if (update_after_move) {
            this.update_after_move(info,pos2);
            return;
        }

        info.tip_point_update_in_round = vuex.state.round_count;
        info.tip_point_all = [];            // 按游戏规则所有能走的点
        info.tip_point_right = [];          // 所有能走的点,排除掉那些是队友的点
        info.tip_point_to_eat = [];         // 能走且可以吃对方的棋子
        info.tip_point_to_be_eat = [];      // 能走但会被对方吃的点

        this[info.type]();
        // 是否将死

        return info;
    }
}

calc_tip_point.update_after_move = function(info,pos2){
    this.red_piece_pos.concat(this.black_piece_pos).forEach((pos) => {
        let cur_info = this.chessboard[pos[1]][pos[0]];

        if((pos[0] === info.x && pos[1] === info.y) ||
            cur_info.tip_point_all.includes_array(pos) || 
            cur_info.tip_point_all.includes_array(pos2)){
            calc_tip_point.entry(cur_info);
        }
    });
    info = this.entry(info);
};
calc_tip_point._add_point = function(x,y){
    let piece_info = this.chessboard[y][x],
        piece_type = piece_info.is_empty ? 0 : (piece_info.color === this.info.color ? -1 : 1); // 指定坐标上是 1: 对方棋子; -1: 己方棋子; 0: 空位;

    let pos = [x,y];
    this.info.tip_point_all.push(pos);
    if (piece_type === -1) return false; //当是己方棋子时不能走

    this.info.tip_point_right.push(pos);        //可以走
    if(piece_type === 1){ //当是对方棋子时 可以吃
        this.info.tip_point_to_eat.push(pos);
    }
    if(window.calc_tip_point_to_be_eat && this._will_not_be_eat(x,y)){ // 是否要计算会不会被吃
        this.info.tip_point_to_be_eat.push(pos);
    }
};
calc_tip_point._will_not_be_eat = function(x,y){
    let enemy_piece_pos = this[this.info.color === 'red' ? 'black_piece_pos' : 'red_piece_pos'],
        my_point = [x,y].toString(),
        that = this;

    return enemy_piece_pos.some((pos) => {
        let enemy_info = that.chessboard[pos[1]][pos[0]];
        if (enemy_info.tip_point_all && enemy_info.tip_point_all.some(enemy_point => enemy_point.toString() === my_point)) {
            // console.log('走这里会被对方吃',this.info.x,this.info.y,this.info.type,this.info.color,
                // enemy_info.x,enemy_info.y,enemy_info.type,enemy_info.color);
            if (enemy_info.type === 'gun') {// gun 是特例 因为gun移动是不能吃子
                return enemy_info.tip_point_to_eat.some(enemy_point => enemy_point.toString() === my_point)
            }
            return true
        }else{
            return false
        }
    });
};
calc_tip_point.king = function(){
    let x = this.info.x,
        y = this.info.y,
    check = (x,y) => {
        if(x >= 3 && x <= 5 && ((y >=0 && y <= 2) || (y >=7 && y <= 9))){
            this._add_point(x,y);
        }
    };
    check(x - 1,y);
    check(x + 1,y);
    check(x,y - 1);
    check(x,y + 1);
};
calc_tip_point.knight = function(){
    let x = this.info.x,
        y = this.info.y,
    check = (x,y) => {
        if(x >= 3 && x <= 5 && ((y >=0 && y <= 2) || (y >=7 && y <= 9))){
            this._add_point(x,y);
        }
    };
    check(x - 1,y - 1);
    check(x + 1,y + 1);
    check(x + 1,y - 1);
    check(x - 1,y + 1);
};
calc_tip_point.elephant = function(){
    let x = this.info.x,
        y = this.info.y,
    check = (x1,y1,x2,y2) => {
        if (y <= 4) { // 上半部分
            x2 >= 0 && x2 <= 8 && y2 >= 0 && y2 <= 4 && this.chessboard[y1][x1].is_empty && this._add_point(x2,y2);
        }else{
            x2 >= 0 && x2 <= 8 && y2 >= 5 && y2 <= 9 && this.chessboard[y1][x1].is_empty && this._add_point(x2,y2);
        }
        
    };
    check(x - 1,y - 1,x - 2,y - 2);
    check(x + 1,y + 1,x + 2,y + 2);
    check(x + 1,y - 1,x + 2,y - 2);
    check(x - 1,y + 1,x - 2,y + 2);
};
calc_tip_point.car = function(){
    let x = this.info.x,
        y = this.info.y,
    go = (x_add,y_add,x,y) => {
        let xx = x + x_add,
            yy = y + y_add;
        if (xx >= 0 && xx <= 8 && yy >= 0 && yy <= 9) {
            this._add_point(xx,yy);
            if(!this.chessboard[yy][xx].is_empty){
                return true;
            }
            go(x_add,y_add,xx,yy);
        }
    };
    go(1,0,x,y);
    go(-1,0,x,y);
    go(0,-1,x,y);
    go(0,1,x,y);
};
calc_tip_point.horse = function(){
    let x = this.info.x,
        y = this.info.y,
    check = (x,y,x1,y1,x2,y2) => {
        if (x >= 0 && x <= 8 && y >= 0 && y <= 9 && this.chessboard[y][x].is_empty) {
            x1 >= 0 && x1 <= 8 && y1 >= 0 && y1 <= 9 && this._add_point(x1,y1);
            x2 >= 0 && x2 <= 8 && y2 >= 0 && y2 <= 9 && this._add_point(x2,y2);
        }
    };
    check(x - 1,y,
        x - 2,y - 1,
        x - 2,y + 1);
    check(x + 1,y,
        x + 2,y - 1,
        x + 2,y + 1);
    check(x,y - 1,
        x + 1,y - 2,
        x - 1,y - 2);
    check(x,y + 1,
        x + 1,y + 2,
        x - 1,y + 2);
};
calc_tip_point.gun = function(){
    let x = this.info.x,
        y = this.info.y,
    go = (x_add,y_add,x,y) => {
        let xx = x + x_add,
            yy = y + y_add;
        if (xx >= 0 && xx <= 8 && yy >= 0 && yy <= 9) {
            if(this.chessboard[yy][xx].is_empty){
                this._add_point(xx,yy);
                go(x_add,y_add,xx,yy);
            }else{
                find_to_eat(x_add,y_add,xx,yy);
                return true;
            }
        }
    },
    find_to_eat = (x_add,y_add,x,y) => {
        let xx = x + x_add,
            yy = y + y_add;
        if (xx >= 0 && xx <= 8 && yy >= 0 && yy <= 9) {
            let info = this.chessboard[yy][xx];
            if(!info.is_empty){
                 info.color !== this.info.color && this._add_point(xx,yy);
            }else{
                find_to_eat(x_add,y_add,xx,yy);
            }
        }
    };
    go(1,0,x,y);
    go(-1,0,x,y);
    go(0,-1,x,y);
    go(0,1,x,y);
};
calc_tip_point.soldier = function(){
    let x = this.info.x,
        y = this.info.y,
        soldier_forward_direction,
        can_he_walk_left_and_right,
    check = (x,y) => {
        if(x >= 0 && x <= 8 && y >= 0 && y <= 9){
            this._add_point(x,y);
        }
    };
        let king_pos = this[`${this.info.color}_piece_pos`][0];
        if(this.info.y > king_pos[1]){
            soldier_forward_direction = 1;
            can_he_walk_left_and_right = this.info.y >= 5 ? true : false;
        }else{
            soldier_forward_direction = -1;
            can_he_walk_left_and_right = this.info.y <= 4 ? true : false;
        }

    check(x,y + soldier_forward_direction);
    if (can_he_walk_left_and_right) {
        check(x + 1,y);
        check(x - 1,y);  
    }
};