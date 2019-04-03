<template>
    <div id="chessboard" v-show="game_status !== 0">
        <div class="left">
            <div style="position:absolute;top:0;"></div>
            <ul v-show="identity === 'red' || identity === 'black'">
                <li>
                    <el-button :disabled="!can_not_regret || now_color === identity" class="left_btn" @click="regret_btn_evt" :plain="true" type="danger" size="large">悔<br>棋</el-button>
                </li>
                
                <li>
                    <el-button :disabled="!can_not_stalemate" class="left_btn" @click="stalemate_btn_evt" :plain="true" type="danger" size="large">和<br>棋</el-button>
                </li>

                <li>
                    <el-button class="left_btn" @click="surrender_btn_evt" :plain="true" type="danger" size="large">认<br>输</el-button>
                </li>
            </ul>
            <div style="position:absolute;bottom:0;"></div>
        </div>
        <div class="chessboard_out_border">
            <ul class="chessboard" @click="piece_click_event">
                <li v-for="(line,Y) of chessboard">
                    <div class="chessboard_modify_center" v-if="Y === 4"></div> 
                    <div class="chessboard-piece" v-for="(piece,X) of line" 
                         :class="{'chessboard_modify_slash': X === 3 && Y === 0 || X === 4 && Y === 1 || X === 3 && Y === 7 || X === 4 && Y === 8,'chessboard_modify_backslash': X === 4 && Y === 0 || X === 3 && Y === 1 || X === 3 && Y === 8 || X === 4 && Y === 7,'chessboard_modify_1': X === 0 && Y === 3 || X === 2 && Y === 3 || X === 4 && Y === 3 || X === 6 && Y === 3 || X === 2 && Y === 6 || X === 4 && Y === 6 || X === 1 && Y === 7 || X === 7 && Y === 7,'chessboard_modify_2': X === 1 && Y === 3 || X === 3 && Y === 3 || X === 5 && Y === 3 || X === 7 && Y === 3 || X === 3 && Y === 6 || X === 5 && Y === 6 || X === 0 && Y === 7 || X === 6 && Y === 7,'chessboard_modify_3': X === 1 && Y === 1 || X === 7 && Y === 1 || X === 2 && Y === 2 || X === 4 && Y === 2 || X === 0 && Y === 5 || X === 2 && Y === 5 || X === 4 && Y === 5 || X === 6 && Y === 5,'chessboard_modify_4': X === 0 && Y === 1 || X === 6 && Y === 1 || X === 3 && Y === 2 || X === 5 && Y === 2 || X === 1 && Y === 5 || X === 3 && Y === 5 || X === 5 && Y === 5 || X === 7 && Y === 5,'chessboard_modify_14': X === 1 && Y === 2 || X === 7 && Y === 2 || X === 0 && Y === 6 || X === 6 && Y === 6,'chessboard_modify_23': X === 0 && Y === 2 || X === 6 && Y === 2 || X === 1 && Y === 6 || X === 7 && Y === 6,'chessboard_modify_center_noborder': Y === 4}">
                        <div :data-x="X" :data-y="Y" class="piece" :class="piece.class" @mouseover="piece_mouse_move_in_event"></div>
                        <div style="pointer-events: none" :class="concat_tip_point_class(X,Y)"></div>
                    </div>
                    <div class="chessboard_modify_center_height" v-if="Y === 4">
                        <span>
                            第{{ round_count }}回合, 轮到{{ now_color==='red'?'红':'黑' }}棋下, 黑棋剩{{black_piece_pos.length}}, 红棋剩{{red_piece_pos.length}};
                        </span>
                    </div>
                </li>
            </ul>
        </div>

    </div>
</template>

<script>
    import Vue from 'vue'
    import event_bus from '../event_bus';
    import { mapState,mapMutations } from 'vuex'

    event_bus.$on('shwo_trace',(moved_piece_trace) => {
        if (window.show_moved_trace && moved_piece_trace.length === 2) {
            // 先去掉痕迹
            var traces = document.getElementsByClassName('moved_piece_trace');
            [...traces].forEach((el) => {
                el.classList.remove('moved_piece_trace');
            });

            var chessboard_piece = document.getElementsByClassName('chessboard-piece');
            var index1 = moved_piece_trace[0][1] * 9 + moved_piece_trace[0][0];
            var index2 = moved_piece_trace[1][1] * 9 + moved_piece_trace[1][0];
            chessboard_piece[index1].classList.add('moved_piece_trace');
            chessboard_piece[index2].classList.add('moved_piece_trace');
        }
    });

    export default {
        name:'chess',
        data(){
            return {

            }
        },
        computed:mapState({
            game_status:'game_status',
            chessboard:'chessboard',
            selecting_piece:'selecting_piece',
            piece_tip_point:'piece_tip_point',

            identity:'identity',
            now_color:'now_color',
            round_count:'round_count',
            black_piece_pos:'black_piece_pos',
            red_piece_pos:'red_piece_pos',

            can_not_regret:'can_not_regret',
            can_not_stalemate:'can_not_stalemate',
        }),
        methods:{
            ...mapMutations({
                commit_selecting_piece:'selecting_piece'
            }),
            chessboard_modify(X,Y){ // xxx 修饰棋盘上的细节样式
                let arr = {
                    chessboard_modify_slash:[
                        [3,0],[4,1],
                        [3,7],[4,8]
                    ],
                    chessboard_modify_backslash:[
                        [4,0],[3,1],
                        [3,8],[4,7]
                    ],
                    chessboard_modify_1:[
                        [0,3],[2,3],[4,3],[6,3],
                        [2,6],[4,6],[1,7],[7,7]
                    ],
                    chessboard_modify_2:[
                        [1,3],[3,3],[5,3],[7,3],
                        [3,6],[5,6],[0,7],[6,7]
                    ],
                    chessboard_modify_3:[
                        [1,1],[7,1],[2,2],[4,2],
                        [0,5],[2,5],[4,5],[6,5]
                    ],
                    chessboard_modify_4:[
                        [0,1],[6,1],[3,2],[5,2],
                        [1,5],[3,5],[5,5],[7,5]
                    ],
                    chessboard_modify_14:[
                        [1,2],[7,2],
                        [0,6],[6,6]
                    ],
                    chessboard_modify_23:[
                        [0,2],[6,2],
                        [1,6],[7,6]
                    ],
                },className = '';
                Object.keys(arr).forEach((cls) => {
                    arr[cls].forEach((pos) => {
                        if (pos[0] === X && pos[1] === Y) {
                            className += `${cls} `;
                        }
                    })
                });
                Y === 4 && (className += 'chessboard_modify_center_noborder ');
                return className;
            },
            concat_tip_point_class(X,Y){
                if (!this.piece_tip_point) {
                    return '';
                }else{
                    let info = this.piece_tip_point,className = '',pos_string = `${X},${Y}`;
                    if(info.tip_point_right && info.tip_point_right.includes_array(pos_string)){
                        className += 'piece tip_point_right ';
                        info.tip_point_to_eat && info.tip_point_to_eat.includes_array(pos_string) && (className += 'tip_point_to_eat ');
                        info.tip_point_to_be_eat && info.tip_point_to_be_eat.includes_array(pos_string) && (className += 'tip_point_to_be_eat ');
                    }
                    return className;
                }
            },
            piece_mouse_move_in_event(e){
                let target = e.target;
                // document.title=target.dataset['x'] + ',' + target.dataset['y'];
                if (this.selecting_piece === false) {
                    let info = this.chessboard[target.dataset['y']][target.dataset['x']];
                    if (!info.is_empty) {
                        event_bus.$emit('show_tip_point',info);
                    }
                }
            },
            _set_selecting_piece(info){
                if(this.selecting_piece !== false){ // 有棋子被选中,先去掉先前选中的棋子
                    this.selecting_piece.class.remove('selecting');
                }
                info.class.add('selecting');
                this.commit_selecting_piece(info);
            },
            _try_move_piece(to_info){
                event_bus.$emit('try_move_piece',[this.selecting_piece,to_info]);
            },
            piece_click_event(e){
                let target = e.target,
                    target_x = target.dataset['x'],
                    target_y = target.dataset['y'];

                if(target_x === undefined || target_y === undefined) return false;  // 点击的不是棋子 也不是空棋位 就返回
                if (this.game_status !== 1) return false;                           // 游戏结束点击无效
                let piece_info = this.chessboard[target_y][target_x];
                if (this.now_color !== this.identity || (this.selecting_piece === false && piece_info.color !== this.identity)) {
                    console.log(`轮到${this.now_color}下棋,或者选择的不是自己的棋子`);
                    if (this.identity === 'black' || this.identity === 'red') {
                        Vue.prototype.$message({
                            type: 'error',
                            message: `轮到${this.now_color}下棋,或者选择的不是自己的棋子`
                        });
                    }
                    return false;
                }
                event_bus.$emit('show_tip_point',piece_info);

                if(!piece_info.is_empty) {                          // 当点击的位置不是空位
                    if (!this.selecting_piece) {                    // 没有棋子被选中
                        this._set_selecting_piece(piece_info);      // 设置当前棋子为选中状态
                    }else{                                          // 已经有一个棋子被选中
                        if (this.selecting_piece.color === piece_info.color) { // 点击的棋子和已选中的棋子是同一阵营
                            this._set_selecting_piece(piece_info);  // 切换选中的棋子
                        }else{
                            this._try_move_piece(piece_info);       // 尝试去吃掉对方的棋子
                        }
                    }
                }else{                                              // 当点击的位置是空位
                    if (this.selecting_piece) {                     // 已经有一个棋子被选中
                        this._try_move_piece(piece_info);           // 尝试去移动棋子
                    }
                }
            },
            regret_btn_evt(){
                event_bus.$emit('ask_for_regret');
            },
            stalemate_btn_evt(){
                event_bus.$emit('ask_for_stalemate');
            },
            surrender_btn_evt(){
                event_bus.$emit('surrender');
            },
        },
        mounted(){
            window.onresize();
        }
    };
    window.onresize = function(){
        let c = document.getElementById('chessboard');
        if (c === null) return false;
        let p = c.parentElement,
            h_zoom = p.clientHeight / 597,
            w_zoom = p.clientWidth / 603,
            zoom = Math.min(h_zoom,w_zoom).toFixed(2) - 0.01;
        c.style.zoom = zoom;
    };
    
</script>

<style scoped>
    @import 'chess.css';
    @font-face {
        font-family: myfont;
        font-style: normal;
        src: url(font.otf);
    }
    #chessboard{
        position: relative;
        height: 600px;
        width: 610px;
        overflow: hidden;
    }
    .chessboard_out_border{
        background: burlywood;
        border: 12px double;
        margin-bottom: 8px;

        margin-left: 80px;
        display: inline-block;
    }
    .chessboard{
        padding: 0;
        font-size: 0;
        display: block;
        margin-left: 50px;
        margin-top: 40px;
        margin-bottom: -10px;
    }
    .chessboard_modify_center_height{
        font-size: 16px;
        text-align: center;
        height: 35px;
        line-height: 40px;
        width: 88.8888889%;
    }
    .piece{
        /*box-shadow: 1px 1px 1px 1px rgb(243, 179, 97);*/
    }
    .left{
        position: absolute;
        height: 100%;
        width: 80px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
    }
    .left_btn{
        /* font-family: myfont; */
        display: block;
        width: 50px;
        padding-left: 0;
        padding-right: 0;
    }
    .left ul{
        margin: 0;
        padding: 0;
        width: 100%;
        list-style: none;
        text-align: center;
        height: auto;
    }
    .left ul li{
        margin:8px 0;
    }
</style>