<template>
    <div class="chat">
        <div class="chat-part">
            <template v-for="chat_detail of chat_list" >
                <div class="p" :class="{'right':chat_detail.poster_id === id,'center':chat_detail.type === 'system'}">
                    <!-- 系统消息 -->
                    <el-tag v-if="chat_detail.type === 'system'" type="primary" :hit="true">{{chat_detail.msg}}</el-tag>
                    <!-- 分割线 -->
                    <div v-if="chat_detail.type === 'hr'" class="hr"></div>
                    <!-- 用户消息 -->
                    <template v-if="chat_detail.type === 'msg'">
                        <el-button v-if="chat_detail.poster_id !== id" :plain="true" type="success"
                            :class="{'black_border':chat_detail.identity === 'black','red_border':chat_detail.identity === 'red'}">
                            {{chat_detail.poster_nickname}}
                        </el-button>
                        <span class="msg" :class="{'msg-right':chat_detail.poster_id === id,'msg-left':chat_detail.poster_id !== id}">
                            {{chat_detail.msg}}
                        </span>
                        <el-button v-if="chat_detail.poster_id === id" :plain="true" type="info"
                            :class="{'black_border':chat_detail.identity === 'black','red_border':chat_detail.identity === 'red'}">
                            {{chat_detail.poster_nickname}}
                        </el-button>
                    </template>
                </div>
            </template>
        </div>
        <div class="send-part">
            <el-input @keyup.enter.native="send_event" v-model.trim="input" placeholder="请输入内容"></el-input>
            <el-button slot="append" @click="send_event" class="send-btn" type="primary">发送</el-button>
        </div>
    </div>
</template>
<script>
    import vuex from '../vuex_store';
    import client from '../client';

    export default {
        name:'chat',
        data() {
            return {
                input:'',
            }
        },
        computed:{
            id(){
                return client.socket.id;
            },
            chat_list(){
                return vuex.state.chat_list;
            },
            get_nickname(){
                return vuex.state.nickname;
            }
        },
        updated(){
            var el = document.getElementsByClassName('chat-part')[0];
            el && (el.scrollTop = el.scrollHeight);
        },
        methods:{
            send_event(){
                if (this.input === '') return false;
                client.post_msg(this.input);
                this.input = '';
            }
        },
    }
</script>
<style scoped>
    .msg{
        word-wrap: break-word;
        word-break: break-all;
        font-family: Helvetica Neue,Helvetica,Hiragino Sans GB,Microsoft YaHei,\\5FAE\8F6F\96C5\9ED1,Arial,sans-serif;
        -webkit-font-smoothing: antialiased;
        line-height: 1.6;
        border-radius: 3px;
        -moz-border-radius: 3px;
        -webkit-border-radius: 3px;
        background-color: #b2e281;
        max-width: 500px;
        min-height: 1em;
        display: inline-block;
        vertical-align: top;
        position: relative;
        text-align: left;
        font-size: 14px;
        border-radius: 3px;
        -moz-border-radius: 3px;
        -webkit-border-radius: 3px;
        margin: 0 10px;
        padding: 9px 13px;


    }
    .msg-left::before{
        border: 6px solid transparent;
        border-right-color: #b2e281;
        border-right-width: 4px;
        right: 100%;
        position: absolute;
        top: 14px;
        content: " ";
    }
    .msg-right::after{
        border: 6px solid transparent;
        border-left-color: #b2e281;
        border-left-width: 4px;
        left: 100%;
        position: absolute;
        top: 14px;
        content: " ";
    }
    .p{
        display: flex;
        align-items: center;
        margin: 12px 0;
    }
    .p.right{
        justify-content: flex-end;
    }
    .p.center{
        justify-content: center;
    }
    .hr{
        border-top: 1px solid gray;
        width: 100%;
    }
    .chat{
        background-color: #eee;
        height: 100%;
        width: 100%;
        position: relative;
        border: 1px solid gray;
    }
    .chat-part{
        overflow-y: auto;
        position: absolute;
        bottom: 50px;
        width: 100%;
        height: calc(100% - 50px);
        padding: 8px;
    }
    .send-part{
        border-top: 1px solid #d6d6d6;
        display: flex;
        justify-content: space-around;
        padding: 8px;
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 53px;
    }
    .send-btn{
        margin-left: 10px;
    }
    .black_border{
        border-color: black;
    }
    .red_border{
        border-color: red;
    }
    .responsive_btn{
        display: none;
    }
    @media screen and (max-width: 768px) {
        .responsive_btn{
            display: block;
        }
    }
    .red_border,.black_border{
        padding: 5px;
    }
</style>