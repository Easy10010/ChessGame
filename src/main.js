import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import Vue from 'vue'
import store from './vuex_store'
import router from './router.js'
import event_bus from './event_bus'

import gameover from './mycomponents/game_over'

import sound_move_res_url from './resource/move.wav'


document.title = 'Chess';

Vue.use(ElementUI)

Vue.config.productionTip = false;


var main_vue = new Vue({
  el: '#app',
  router,
  store,
  template: `
    <div id="app">
        <router-view></router-view>
    </div>
  `,
  components:{
    gameover
  }
});

var sound = (function(){
    var play_sound = {
        sound_eat(){
            this.sound_move();
        },
        sound_move(){
            audioEl.src = sound_move_res_url;
            audioEl.play();
        },
        sound_win(){},
        sound_lose(){},
    },
    audioEl = document.createElement('audio');

    event_bus.$on('sound_eat',() => play_sound.sound_eat());
    event_bus.$on('sound_move',() => play_sound.sound_move());
    event_bus.$on('sound_win',() => play_sound.sound_win());
    event_bus.$on('sound_lose',() => play_sound.sound_lose());

    return play_sound;
})();

var style = document.createElement('style')
style.innerHTML = `
    .el-message-box{
        width:80%;
        max-width:420px;
    }
`
document.head.appendChild(style);
window.VUE = Vue;
window.vue = window.main_vue = main_vue;
window.sound = sound;

Array.prototype.remove = function(item){
    if (item instanceof Array) {
        let item_string = item.toString();
        for(let i = 0,len = this.length; i < len; i++){
            if(this[i].toString() === item_string){
                this.splice(i,1)
                return true;
            }
        }
        return false;
    }
    let index = this.indexOf(item);
    return index < 0 ? false : this.splice(index,1);
}
Array.prototype.add = function(item){return this.includes(item) ? () => {this.remove(item);this.push(item);} : this.push(item);};
Array.prototype.toggle = function(item){return this[this.includes(item) ? 'remove' : 'push'](item);};
Array.prototype.contains = Array.prototype.includes;
Array.prototype.includes_array = function(array,want_sort=false){
    let array_string = (want_sort ? array.sort() : array).toString();
    return this.some(v => (want_sort ? v.sort() : v).toString() === array_string);
};
Array.prototype.index_array = function(array,want_sort=false){
    let array_string = (want_sort ? array.sort() : array).toString();
    for(let i=0,len=this.length;i<len;i++){
        if ((want_sort ? this[i].sort() : this[i]).toString() === array_string) {
            return i;
        }
    }
    return -1;
}
export default main_vue;