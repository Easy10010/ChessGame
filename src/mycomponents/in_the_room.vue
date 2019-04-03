<template>
    <transition name="fade">
    <div class="in_the_room" v-show="!hidden">
        <!-- 头部 -->
        <el-menu class="header" mode="horizontal" style="z-index: 1;" theme="dark">
            <el-menu-item index="2" style="display: none">
                <el-button @click="chess_test_mode_event" icon="edit" type="primary">
                    测试模式
                </el-button>
            </el-menu-item>
            <el-tooltip content="离开当前房间" effect="dark" placement="bottom-end">
                <el-menu-item @click="leave_room_btn_event" index="1" style="float: right">
                    <el-button icon="close" type="text"></el-button>
                </el-menu-item>
            </el-tooltip>
            <el-menu-item index="3" style="float: right">
                <el-button type="text">
                    {{nickname}}
                </el-button>
            </el-menu-item>
            <el-menu-item index="4" style="float: right;display: flex;justify-content: center;align-items: center;">
                <el-tag>
                    在线人数: {{online_user}}
                </el-tag>
            </el-menu-item>
        </el-menu>
        <!-- 头部 -->
        <el-row style="height: calc(100% - 60px);overflow: hidden;">
            <!-- 左边 -->
            <el-col :xs="24" :sm="18" id="main_content">
                <!-- 准备 -->
                <ready v-if="game_status === 0"></ready>
                <!-- 棋盘 -->
                <chess v-else></chess>
            </el-col>
            <!-- 右边 聊天框 -->
            <el-col :xs="16" :sm="6" style="height: 100%;" class="responsive_chat" :class="{'width_0':width_0}">
                <el-button @click="chat_btn_click" class="responsive_btn" type="primary" :icon="chat_btn_icon"></el-button>
                <chat></chat>
            </el-col>
        </el-row>
    </div>
    </transition>
</template>
<script>
    import Vue from 'vue'
    import vuex from '../vuex_store'
    import chat from './chat'
    import ready from './ready'
    import chess from './chess'
    import event_bus from '../event_bus';
    import '../client_game';
    import { mapState } from 'vuex'

    event_bus.$on('new_msg',() => {
        var el = document.getElementsByClassName('responsive_btn');
        el = el[0].getElementsByClassName('el-icon-arrow-left');
        if (el.length > 0) {
            el = el[0];
        }else{
            return false;
        }
        el.style.animation = 'new_msg_anim 1.2s cubic-bezier(0.6, -0.28, 0.74, 0.05) 5';
        el.addEventListener('animationend', (e) => {
            el.style.animation = '';
        },{once:true});
    });
    var leave = function(e) {
        var el = document.getElementsByClassName('in_the_room');
        el = el[0] ? el[0] : undefined;
        var _vue = el && el.__vue__ ? el.__vue__ : undefined;
        _vue = _vue ? _vue.$parent : undefined;
        if(_vue && _vue.hidden === false){
            var r = confirm("")
            if(r){
                console.log(1);
                if(_vue.leave_room_btn_event){
                    _vue.leave_room_btn_event();
                }
            }else{
                e.preventDefault();
            }
            
        }
    };
    window.onpopstate = leave;
    window.beforeunload = leave;
    // window.addEventListener("popstate", leave, false);
    // window.addEventListener("beforeunload", leave, false);

    
    export default {
        name:'in_the_room',
        data() {
            return {
                chat_btn_icon: 'arrow-right',
                width_0:false,
                hidden:false,
            }
        },
        methods:{
            chat_btn_click(){
                if(this.chat_btn_icon === 'arrow-right'){
                    this.chat_btn_icon = 'arrow-left';
                    this.width_0 = true;
                }else{
                    this.chat_btn_icon = 'arrow-right';
                    this.width_0 = false;
                }
            },
            play_again(){

            },
            leave_room_btn_event(){
                if (vuex.state.can_leave_room === false) {
                    event_bus.$emit('leave_room');
                    this.hidden = true;
                }else{
                    Vue.prototype.$msgbox({
                        title: '确定离开房间?',
                        message: vuex.state.can_leave_room,
                        showCancelButton: true,
                        confirmButtonText: '离开房间',
                        cancelButtonText: '取消',
                        type:'info',
                        callback: (action, instance) => {
                            if (action === 'cancel') {

                            }else if(action === 'confirm'){
                                event_bus.$emit('leave_room');
                                this.hidden = true;
                            }
                        }
                    })
                }
            },
            mounted(){
                this.hidden = false;
            },
            chess_test_mode_event(){},
        },
        computed:mapState({
            identity:'identity',
            nickname:'nickname',
            game_status:'game_status',
            online_user:'online_user',
        }),
        components: {chat,ready,chess}
    }
</script>
<style scoped>
    .in_the_room{
        width: 100%;
        height: 100%;
    }
    #main_content{
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .responsive_chat{
        z-index: 8;
        transition: .8s;
    }
    .responsive_chat.width_0{
        transform: translateX(100%);
    }
    .responsive_btn{
        display: none;
        position: absolute;
        bottom: 10px;
        left: -46px;
        z-index: 9;
    }
    @media screen and (max-width: 768px) {
        .responsive_chat{
            position: absolute;
            right: 0;
        }
        .responsive_btn{
            display: block;
        }
    }
    .fade-enter-active, .fade-leave-active {
      transition: .8s
    }
    .fade-enter{
      transform: translateY(-100%)
    }
/*.el-icon-arrow-left*/
    .abcd{
        animation: new_msg_anim 1.2s cubic-bezier(0.6, -0.28, 0.74, 0.05);
        animation-iteration-count: infinite;
        zoom:3;
    }

    @keyframes new_msg_anim{
        0%{
            transform: translateX(0%);
        }
        50%{
            transform: translateX(-200%);
        }
        50.000000001%{
            transform: translateX(200%);
        }
        100%{
            transform: translateX(0%);
        }
    }
</style>