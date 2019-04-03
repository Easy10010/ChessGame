<template>
    <div class="gameover">
        <h1 class="textcenter"
            :class="{win:which_win === identity,lose:identity !== 'guest' && which_win !== identity,red: identity === 'guest' && which_win === 'red',black: identity === 'guest' && which_win === 'black' }">
             {{ main_title }} 
        </h1>
        <div class="textcenter" v-html="second_title"></div>
        <p class="textcenter">黑棋剩子: {{ data.black_remnant_count }}</p>
        <p class="textcenter">红棋剩子: {{ data.red_remnant_count }}</p>
        <p class="textcenter">游戏用时: {{ spend_time }}</p>
        <p class="textcenter">游戏回合: {{ data.round_count }}</p>
    </div>
</template>
<script>
    import chessboard from './chess';
    import vuex from '../vuex_store';

    export default {
        name:'game_over',
        data() {
            return {
            }
        },
        methods:{
        },
        computed:{
            spend_time(){
                var spend = this.data.game_over_timestamp - this.data.game_start_timestamp;
                var minute = (spend / 1000 / 60).toFixed(0);
                return `${ minute } 分钟`;
            },
            which_win(){
                var str = String(this.data.game_status);
                if (str[0] === '1') {
                    return 'black';
                }else if (str[0] === '2'){
                    return 'red';
                }
            },
            win_reason(){
                var type = String(this.data.game_status)[1];
                var loser = this.which_win === 'red' ? '黑色方' : '红色方';
                var reason;
                switch(type){
                    case '1':
                        reason = `${loser} 被将死`;break;
                    case '2':
                        reason = `${loser} 无子可走`;break;
                    case '3':
                        reason = `${loser} 中途离场`;break;
                    case '5':
                        reason = `${loser} 认输`;break;
                }
                return reason;
            },
            second_title(){
                var winner_name = this.data.player[this.which_win][1];
                var which_win_zh = this.which_win === 'red' ? '红' : '黑';
                var type = String(this.data.game_status)[1];
                if (type === '4') {
                    return ``;
                }
                return `
                    <strong> ${this.win_reason} </strong>
                    `;
            },
            main_title(){
                var type = String(this.data.game_status)[1];
                if (type === '4') {
                    return '双方同意和棋';
                }
                if (this.identity === 'guest') {
                    return this.which_win === 'red' ? '红色方赢' : '黑色方赢';
                }
                return this.which_win === this.identity ? '你赢了' : '你输了'
            }
        },
        components: {chessboard},
        props:['data','identity']

    }
</script>
<style scoped>
    .textcenter{
        text-align: center;
    }
    .red{
        color:red;
    }
    .black{
        color:black;
    }
    .win{
        color:green;
    }
    .lose{
        color:black;
    }
</style>