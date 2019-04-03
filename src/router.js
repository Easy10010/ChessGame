import Vue from 'vue'
import Router from 'vue-router'
import event_bus from './event_bus'

import room_list_scene from './mycomponents/room_list_scene'
import in_the_room from './mycomponents/in_the_room'
import test_scene from './mycomponents/test_scene'

Vue.use(Router);
var router = new Router({
  routes: [
    {
      path: '/',
      name: 'room_list_scene',
      component: room_list_scene
    },
    {
      path: '/inRoom',
      name: 'in_the_room',
      component: in_the_room
    },
    {
      path: '/test',
      name: 'test',
      component: test_scene
    }
  ]
})

event_bus.$on('router_test',() => {
  router.push('test');
})
event_bus.$on('router_root',() => {
  router.push('/');
})
event_bus.$on('router_room_list',() => {

})
event_bus.$on('router_in_the_room',() => {
  router.push('inRoom')
})


export default router
