<template>
    <transition name="fade">
    <div id="room_list_scene">
        <!-- 头部 -->
        <el-menu class="header" theme="dark" mode="horizontal">
          <el-menu-item index="1">
            <el-button @click="create_room_btn_event" type="primary" icon="plus">创建房间</el-button>
          </el-menu-item>
          <el-menu-item index="2" class="right">
            <el-tooltip effect="dark" content="点击这里,可以修改昵称" placement="bottom-end">
              <el-button @click="edit_nickname" v-show="input_nickname === 0" type="text">{{nickname}}</el-button>
            </el-tooltip>
            
            <el-input @keydown.enter.native="edit_nickname_finish" @keydown.esc.native="edit_nickname_finish" @blur="edit_nickname_finish" :autofocus="true" :minlength="1" v-model="input_nickname" v-show="input_nickname !== 0" placeholder="请输入昵称">
                <template slot="prepend">新昵称:</template>
            </el-input>
          </el-menu-item>
          <el-menu-item index="3" class="right online_user">
            <el-tag>在线人数: {{online_user}}</el-tag>
          </el-menu-item>
        </el-menu>
        <!-- 头部 -->
        <div class="line"></div>
        <!-- 载入中 -->
        <div class="loading" v-loading.body="connecting" element-loading-text="连接服务器中..."></div>
        <!-- 房间列表 -->
        <el-row :gutter="20" >
          <el-col :lg="6" :sm="8" :xs="24" 
            v-for="(room,roomid) of rooms_list"
            :key="roomid">
                <el-card class="box-card">
                  <div slot="header" class="clearfix">
                    <el-badge class="mark" :value="room.num">
                      <span style="line-height: 36px;" v-text="room.room_name"></span>
                    </el-badge>
                    <el-tag v-if="room.game_status === 1" type="gray">游戏中...</el-tag>
                    <el-tag v-if="room.game_status === 2" type="gray">游戏结束</el-tag>
                    <el-button @click.native="enter_room_btn_event" :data-roomid="roomid" class="right" type="primary">进入房间</el-button>
                  </div>
                  <div style="color:red;margin:8px 0;">
                    <el-tag type="danger">红棋 : </el-tag>
                    <i v-if="!room.who_inside.red">缺位</i>
                    <span v-else v-text="room.who_inside.red[1]"></span>
                  </div>
                  <div style="color:black;margin:8px 0;">
                    <el-tag>黑棋 : </el-tag>
                    <i v-if="!room.who_inside.black">缺位</i>
                    <span v-else v-text="room.who_inside.black[1]"></span>
                  </div>
                  <div v-for="guest of room.who_inside.guest" style="margin:8px 0;">
                    <el-tag type="gray">观众 : </el-tag>
                    {{guest[1]}}
                  </div>
                </el-card>
                <div class="line"></div>
          </el-col>
        </el-row>
        <!-- 房间列表 -->
    </div>
    </transition>
</template>
<script>
    // import event_bus from '../event_bus'
    import vuex from '../vuex_store'
    import client from '../client'


    export default {
        name:'room_list_scene',
        data() {
            return {
                input_nickname:0,
            }
        },
        mounted(){
        },
        computed:{
            connecting(){
                return vuex.state.connecting;
            },
            rooms_list(){
                return vuex.state.rooms_list;
            },
            online_user(){
                return vuex.state.online_user;
            },
            nickname(){
                return vuex.state.nickname;
            },
        },
        methods: {
            create_room_btn_event() {
                client.create_room()
            },
            enter_room_btn_event(e){
                let roomid = e.target.dataset['roomid'] || e.target.parentElement.dataset['roomid'];
                if (!roomid) return false;
                client.enter_room(roomid);
            },
            // 修改昵称
            edit_nickname(){
                this.input_nickname = this.nickname;
            },
            // 确认修改昵称
            edit_nickname_finish(e){
                if (e.type==="blur" || (e.type==="keydown" && e.keyCode === 13)) {
                    console.log(this.input_nickname)
                    if (this.input_nickname.length > 0) {
                        if (this.nickname !== this.input_nickname) {
                            client.set_nickname(this.input_nickname,'localStorage');
                        }
                    }else if(this.input_nickname !== 0){
                        Vue.prototype.$message({
                            type: 'info',
                            message: '输出了无效昵称'
                        });
                    }
                }
                this.input_nickname = 0;
            },

        }
    }
</script>
<style scoped>
    .line{
        height: 20px;
    }
    .right{
        float: right;
    }
    .online_user{
        display: flex;justify-content: center;align-items: center;
    }
    .loading{
        height: 100%;
    }
    .room_list_scene{
        position: absolute;
        left: 0;
        top: 0;
    }
    .fade-enter-active, .fade-leave-active {
      transition: .8s
    }
    .fade-enter{
      transform: translateY(-100%)
    }
    .el-menu-item{
        padding: 0 8px;
    }
</style>