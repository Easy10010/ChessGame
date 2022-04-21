import io from 'socket.io-client'
import Vue from 'vue'
import vuex from './vuex_store'
import event_bus from './event_bus'


var socket_url = `${location.hostname}:8081/`;
var socket = io(socket_url);
console.info(socket_url)

// 将数据保存
window.socket = socket;
window.debug = window.sendcode = sendcode;

socket.on('disconnect',() => {
    console.error('服务器挂了,失去连接','警告');
    Vue.prototype.$alert('服务器挂了,失去连接','警告');
    if (vuex.state.disconnect_count > 10) {
        socket.disconnect();
        console.error('已彻底断开连接');
        Vue.prototype.$alert('已彻底断开连接','警告');
    }else{
        vuex.commit('disconnect_count');
    }
});
socket.on('__connected', () => { // 成功连接服务器
    if (vuex.state.in_a_room || location.hash.length > 2) {
        leave_room(true);
    }
    console.log('连接成功');
    vuex.commit('connecting',false);
    // 设置昵称
    if (localStorage['nickname'] !== undefined) {
        set_nickname(localStorage['nickname'],'localStorage');
    }else if (sessionStorage['nickname'] !== undefined) {
        set_nickname(sessionStorage['nickname']);
    }else{
        set_random_nickname();
    }
});
socket.on('error', (error) => {
    console.error('连接失败');
    Vue.prototype.$message({
        type: 'error',
        message: '连接失败: ' + error
    });
});
socket.on('connect_timeout', (timeout) => {
    console.error('连接超时');
    Vue.prototype.$message({
        type: 'error',
        message: '连接超时: ' + timeout
    });
});

// 杂项
socket.on('refesh_room_list',(data) => {
    vuex.commit('rooms_list',data);
});
socket.on('refesh_online_user',(data) => {
    vuex.commit('online_user',data);
});


// 昵称
function set_nickname (nickname,set_in){ // 设置昵称
    socket.emit('set_nickname',{
        nickname
    });
    if(set_in === 'localStorage'){
        localStorage['nickname'] = nickname;
    }else{
        sessionStorage['nickname'] = nickname;
    }
    vuex.commit('nickname',nickname);
}
function set_random_nickname(){
    socket.emit('set_random_nickname',(nickname) => {
        console.log('get a random nickname',nickname);
        // sessionStorage['nickname'] = nickname;
        delete sessionStorage['nickname'];
        Vue.prototype.$message({
            type: 'success',
            message: '你被随机分配昵称: ' + nickname
        });
        vuex.commit('nickname',nickname);
    });
}
function get_nickname(){
    return vuex.state.nickname;
}

// 房间
event_bus.$on('create_room',create_room);
function create_room(room_name=get_nickname()){ // 创建并进入房间
    let roomid = new Date().getTime();
    socket_emit({
        name:'create_room',
        callback(data){
            if (data.succ) {
                _enter_room_next(data);
            }else{
                console.error(data.msg);
                Vue.prototype.$message({
                    type: 'error',
                    message: data.msg
                });
            }
        },
        roomid,
        room_name: room_name + '的房间'
    });
}

event_bus.$on('enter_room',enter_room);
function enter_room (roomid){ // 进入房间
    socket_emit({
        name:'enter_room',
        callback(data){
            if (data.succ) {
                _enter_room_next(data);
            }else{
                console.error(data.msg);
                Vue.prototype.$message({
                    type: 'error',
                    message: data.msg
                });
            }
        },
        roomid,
    });
}
function _enter_room_next(data){
    vuex.commit('in_a_room',true);
    vuex.commit('roomid',data.roomid);
    
    event_bus.$emit('router_in_the_room');
    window.onresize();
    vuex.commit('identity',data.identity);
    if (data.identity === 'guest' && data.room.game_status === 1) {
        event_bus.$emit('require_game_data');
    }
}
event_bus.$on('leave_room',leave_room);
function leave_room(s) { // 离开房间
    let leave = () => {
        event_bus.$emit('router_root');
        vuex.commit('in_a_room',false);
        vuex.commit('roomid',0);
        event_bus.$emit('del_game_data');
        vuex.commit('chat_list',{'type':'hr'});
    };
    if (s) {
        leave();
        return;
    }
    socket_emit({
        name:'leave_room',
        callback(data){
            if (!data.succ) {
                console.error(data.msg);
                Vue.prototype.$message({
                    type: 'error',
                    message: data.msg
                });
            }
            leave();          
        },
    });
}
window.onunload = (e) => {
    if(vuex.state.can_leave_room){
        if(!confirm(vuex.state.can_leave_room)){
            e.preventDefault();
        }
    }
};
socket.on('someone_enter_room',(data) => {
    vuex.commit('chat_list',data);
});
socket.on('someone_leave_room',(data) => {
    vuex.commit('chat_list',data);
});
// 信息
function post_msg(msg){ // 发言(只能在房间内发言)
    socket_emit({
        name:'post_msg',
        callback(msg){
            console.error(msg);
            Vue.prototype.$message({
                type: 'error',
                message: msg
            });
        },
        msg
    });
}
socket.on('recv_msg', function (data) {
    vuex.commit('chat_list',data);
    event_bus.$emit('new_msg');
});
socket.on('is_alive', () => {
    socket.emit('i_am_alive');
});

function sendcode(code){
    socket_emit({
        name:'code',
        callback(msg){
            console.info(msg);
        },
        code
    });
}
event_bus.$on('socket_emit',socket_emit);
function socket_emit(arg) {
    let name = arg.name,callback = arg.callback;
    delete arg.name;
    callback && (arg.callback = name + '_callback');
    arg.timestamp = new Date().getTime();
    if(arg.console !== undefined){
        console.info(arg.console,arg);
        delete arg.console;
    }
    if (callback && !socket._callbacks[`$${name}_callback`]) {
        socket_on(name + '_callback',callback);
    }
    socket.emit(name,arg);
}
event_bus.$on('socket_on',socket_on);
function socket_on(evt,callback){
    socket.on(evt,(data) => {
        console.log('socket_on',evt,data);
        console.info(evt,window.last_package_evt);
        if (data.timestamp) {
            if (data.timestamp <= window.last_package_timestamp && evt === window.last_package_evt) {
                console.log('收到过时或重复的包',evt,data.timestamp,window.last_package_timestamp,data);
                return;
            }else{
                window.last_package_timestamp = data.timestamp;
                window.last_package_evt = evt;
            }
        }else{
            console.log('没有时间戳',evt)
        }
        callback(data);
    });
}

export default {
    socket,
    create_room,
    enter_room,
    leave_room,
    post_msg,
    set_nickname,
    socket_emit,
    socket_on
}