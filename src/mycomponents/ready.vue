<template>
    <div class="ready">
        <!-- 只显示给观众的等待按钮 -->
        <el-button size="large" class="ready_btn" :plain="true" type="info"
            v-if="game_status === 0 && identity === 'guest'"
        > 等待中... </el-button>

        <el-button v-else size="large" class="ready_btn" :type=" is_ready ? 'success' : 'warning' " @click="click_to_ready">
            {{ is_ready ? '已准备' : '准备' }}
        </el-button>
        
        <p class="tip">双方准备后,游戏才开始</p>
        <div v-if="room_info">
            <div style="color:red;margin:8px 0;">
                <el-tag type="danger">红棋 : </el-tag>
                <i v-if="!room_info.who_inside.red">缺位</i>
                <span v-else v-text="room_info.who_inside.red[1]"></span>
            </div>
            <div style="color:black;margin:8px 0;">
                <el-tag>黑棋 : </el-tag>
                <i v-if="!room_info.who_inside.black">缺位</i>
                <span v-else v-text="room_info.who_inside.black[1]"></span>
            </div>
            <div v-for="guest of room_info.who_inside.guest" style="margin:8px 0;">
                <el-tag type="gray">观众 : </el-tag>
                {{guest[1]}}
            </div>
        </div>
    </div>
</template>

<script>
    import event_bus from '../event_bus'
    import { mapState } from 'vuex'

    export default {
        name:'ready',
        data(){
            return {
                is_ready:false
            }
        },
        computed:mapState({
            roomid:'roomid',
            rooms_list:'rooms_list',
            identity:'identity',
            game_status:'game_status',

            room_info(){
                return this.rooms_list[this.roomid];
            },
        }),
        methods:{
            click_to_ready(){
                this.is_ready = !this.is_ready;
                event_bus.$emit('set_ready',this.is_ready);
            },
        },
    };

</script>

<style scoped>
    .ready{
        display: flex;
        justify-content: center;
        align-items: center;
        flex-flow: column;
    }
    .ready_btn{
        padding: 1em 2em;
    }
    .tip{
        font-size: 80%;
        color: grey;
    }
</style>