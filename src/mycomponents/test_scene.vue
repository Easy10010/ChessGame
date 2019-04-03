<template>
    <div>
        <gameover :data="d" :identity="identity"></gameover>
    </div>
</template>
<script>
    import gameover from './game_over'
    export default {
        name:'test_scene',
        data(){
            return {
                d:{
                    'player':{
                        'red':              [123,'A'],
                        'black':            [123,'B']
                    },
                    'now_color':            'red',
                    'round_count':          10,
                    'game_status':          12,
                    'roomid':               123,
                    'game_start_timestamp': 1504330459346,
                    'game_over_timestamp':  1504330459346 + 600000,
                },
                identity:'red'
            }
        },
        components:{gameover},
    }
</script>