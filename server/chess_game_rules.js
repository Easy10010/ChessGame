//当to为同类棋子是也返回true
// piece_pos = {
//     black:{
//         '1,2':'xxx'
//     },
//     red:{
//         '1,2':'xxx'
//     },
//     black_king_pos_string:'',
//     red_king_pos_string:'',
//     black_king_pos:[],
//     red_king_pos:[],
// }
// data = {
//     from:         [x,y],
//     to:           [x,y],
//     from_color:   from_info.color,
//     from_type:    from_info.type,
//     to_color:     to_info.color,
//     to_type:      to_info.type,
//     to_is_empty:  to_info.is_empty,
//     identity:     vuex.state.identity,
//     round_count:  vuex.state.round_count,
//     red_piece_count,
//     black_piece_count,
// }


// 判断这步棋是否符合游戏规则
function is_right_to_go(piece_pos,data){
    is_right_to_go.piece_pos = piece_pos;
    // var from_string = data.from.toString(),
    var from_type = data.from_type;
    
    var right_way = is_right_to_go[from_type](data.from[0],data.from[1]);
    if(right_way.includes_array(data.to)){
        if(is_right_to_go.check_the_king_is_on_a_straight_line(data) === true){
            return {
                'succ':false,
                'msg':'帅与将不能在同一直线上直面对面'
            };
        }

        if(data.to_is_empty){
            return true;
        }else{
            return data.from_color === data.to_color ? {
                'succ':false,
                'msg':'不能吃自己的棋子,出现这条消息就是出现了严重bug'
            } : true;
        }
    }else{
        return {
            'succ':false,
            'msg':'无法这样走'
        };
    }
}
is_right_to_go.check_the_king_is_on_a_straight_line = function(data){   
    var that = is_right_to_go;

    var from_color = data.from_color,
        from_type = data.from_type;
    var black_king_pos = that.piece_pos.black_king_pos,
        red_king_pos = that.piece_pos.red_king_pos,
        black_king_pos_string = that.piece_pos.black_king_pos_string,
        red_king_pos_string = that.piece_pos.red_king_pos_string;
    var to_string = data.to.toString();
    if(from_color === 'red' && to_string === black_king_pos_string
        || from_color === 'black' && to_string === red_king_pos_string){
        return false;
    }
    var pos0,pos1;
    if(from_type === 'king'){
        if((from_color === 'red' && data.to[0] !== black_king_pos[0]) || (from_color === 'black' && data.to[0] !== red_king_pos[0])){
            return false;
        }
        if(from_color === 'red'){
            pos0 = black_king_pos;
            pos1 = data.to;
        }else if(from_color === 'black'){
            pos0 = data.to;
            pos1 = red_king_pos;
        }
    }else{
        if(black_king_pos[0] !== red_king_pos[0]){
            return false;
        }
        pos0 = black_king_pos;
        pos1 = red_king_pos;
    }
    if(!pos0 || !pos1){
        console.error('bug');
        return false;
    }
    // 
    var from_string = data.from.toString(),
        pos1_string = pos1.toString();
    pos0 = Array.from(pos0);
    pos1 = Array.from(pos1);
    for(var i=0;i<9;i++){
        pos0[1] ++;
        var pos0_string = pos0.toString();
        if(pos0_string !== to_string && (!that.piece_pos['black'][pos0_string] && !that.piece_pos['red'][pos0_string])){
            //empty
        }else{
            if(pos0_string === pos1_string){
                return true;
            }else if(pos0_string === to_string){
                return false;
            }else if(pos0_string !== from_string){
                return false;
            }
        }
    }
    return true;
};
is_right_to_go.find_first_type_pos = function(color,type){
    var that = is_right_to_go;
    var pieces = that.piece_pos[color];
    for(var pos in pieces){
        if(pieces[pos] === type){
            pos = pos.split(',');
            pos[0] = Number(pos[0]);
            pos[1] = Number(pos[1]);
            return pos;
        }
    }
    return false;
};
is_right_to_go.pos_color = function(x,y){
    var color;
    if(is_right_to_go.piece_pos.red[`${x},${y}`]){
        color = 'red';
    }else if(is_right_to_go.piece_pos.black[`${x},${y}`]){
        color = 'black';
    }
    return color;
};
is_right_to_go.pos_is_empty = function(x,y){
    return !is_right_to_go.piece_pos.black[`${x},${y}`] && !is_right_to_go.piece_pos.red[`${x},${y}`];
}
is_right_to_go.king = function(x,y){
    var check = (x,y) => {
        if(x >= 3 && x <= 5 && ((y >=0 && y <= 2) || (y >=7 && y <= 9))){
            pos.push([x,y]);
        }
    },pos = [];
    check(x - 1,y);
    check(x + 1,y);
    check(x,y - 1);
    check(x,y + 1);
    return pos;
};
is_right_to_go.knight = function(x,y){
    var check = (x,y) => {
        if(x >= 3 && x <= 5 && ((y >=0 && y <= 2) || (y >=7 && y <= 9))){
            pos.push([x,y]);
        }
    },pos = [];
    check(x - 1,y - 1);
    check(x + 1,y + 1);
    check(x + 1,y - 1);
    check(x - 1,y + 1);
    return pos;
};
is_right_to_go.elephant = function(x,y){
    var check = (x1,y1,x2,y2) => {
        if (y <= 4) {
            x2 >= 0 && x2 <= 8 && y2 >= 0 && y2 <= 4 && is_right_to_go.pos_is_empty(x1,y1) && pos.push([x2,y2]);
        }else{
            x2 >= 0 && x2 <= 8 && y2 >= 5 && y2 <= 9 && is_right_to_go.pos_is_empty(x1,y1) && pos.push([x2,y2]);
        }
        
    },pos = [];
    check(x - 1,y - 1,x - 2,y - 2);
    check(x + 1,y + 1,x + 2,y + 2);
    check(x + 1,y - 1,x + 2,y - 2);
    check(x - 1,y + 1,x - 2,y + 2);
    return pos;
};
is_right_to_go.car = function(x,y){
    var go = (x_add,y_add,x,y) => {
        var xx = x + x_add,
            yy = y + y_add;
        if (xx >= 0 && xx <= 8 && yy >= 0 && yy <= 9) {
            pos.push([xx,yy]);
            if(!is_right_to_go.pos_is_empty(xx,yy)){
                return true;
            }
            go(x_add,y_add,xx,yy);
        }
    },pos = [];
    go(1,0,x,y);
    go(-1,0,x,y);
    go(0,-1,x,y);
    go(0,1,x,y);
    return pos;
};
is_right_to_go.horse = function(x,y){
    var check = (x,y,x1,y1,x2,y2) => {
        if (x >= 0 && x <= 8 && y >= 0 && y <= 9 && is_right_to_go.pos_is_empty(x,y)) {
            x1 >= 0 && x1 <= 8 && y1 >= 0 && y1 <= 9 && pos.push([x1,y1]);
            x2 >= 0 && x2 <= 8 && y2 >= 0 && y2 <= 9 && pos.push([x2,y2]);
        }
    },pos = [];
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
    return pos;
};
is_right_to_go.gun = function(x,y){
    var go = (x_add,y_add,x,y) => {
        var xx = x + x_add,
            yy = y + y_add;
        if (xx >= 0 && xx <= 8 && yy >= 0 && yy <= 9) {
            if(is_right_to_go.pos_is_empty(xx,yy)){
                pos.push([xx,yy]);
                go(x_add,y_add,xx,yy);
            }else{
                find_to_eat(x_add,y_add,xx,yy);
                return true;
            }
        }
    },
    find_to_eat = (x_add,y_add,x,y) => {
        var xx = x + x_add,
            yy = y + y_add;
        if (xx >= 0 && xx <= 8 && yy >= 0 && yy <= 9) {            
            if(!is_right_to_go.pos_is_empty(xx,yy)){
                 pos.push([xx,yy]);
            }else{
                find_to_eat(x_add,y_add,xx,yy);
            }
        }
    },pos = [];
    go(1,0,x,y);
    go(-1,0,x,y);
    go(0,-1,x,y);
    go(0,1,x,y);
    return pos;
};
is_right_to_go.soldier = function(x,y){
    var soldier_forward_direction,
        can_he_walk_left_and_right,
        pos = [],
    check = (x,y) => {
        if(x >= 0 && x <= 8 && y >= 0 && y <= 9){
            pos.push([x,y]);
        }
    };
    (() => {
        var king_pos_string = is_right_to_go.same_color_king_pos_string(x,y);
        var king_pos_y = Number(king_pos_string.split(',')[1]);
        if(y > king_pos_y){
            soldier_forward_direction = 1;
            can_he_walk_left_and_right = y >= 5 ? true : false;
        }else{
            soldier_forward_direction = -1;
            can_he_walk_left_and_right = y <= 4 ? true : false;
        }
    })();
    check(x,y + soldier_forward_direction);
    if (can_he_walk_left_and_right) {
        check(x + 1,y);
        check(x - 1,y);  
    }
    return pos;
};
is_right_to_go.same_color_king_pos_string = function(x,y){
    var which_color;
    if(is_right_to_go.piece_pos.red[`${x},${y}`]){
        which_color = 'red';
    }else if(is_right_to_go.piece_pos.black[`${x},${y}`]){
        which_color = 'black';
    }
    return is_right_to_go.piece_pos[`${which_color}_king_pos_string`];
}
function is_now_way_to_go(piece_pos,identity){
    is_right_to_go.piece_pos = piece_pos;
    var _piece_pos = piece_pos[identity];
    for(var pos_string in _piece_pos){
        var pos = pos_string.split(',');
        var right_way = is_right_to_go[_piece_pos[pos_string]](pos[0],pos[1]);
        if(right_way.length > 0){
            console.log(identity,'不会 无子可走')
            return false;
        }
    }
    console.log(identity,'会 无子可走')
    return true;
}
module.exports = {is_right_to_go,is_now_way_to_go};