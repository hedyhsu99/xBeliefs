import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import ProfilesView from './views/ProfilesView.vue'
import DemosIndex from './views/demos/DemosIndex.vue'
import Demo1 from './views/demos/Demo1Classified.vue'
import Demo2 from './views/demos/Demo2Hero.vue'
import Demo3 from './views/demos/Demo3Flip.vue'
import Demo4 from './views/demos/Demo4Terminal.vue'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/profiles/:id?', component: ProfilesView },
    { path: '/demos', component: DemosIndex },
    { path: '/demos/1', component: Demo1 },
    { path: '/demos/2', component: Demo2 },
    { path: '/demos/3', component: Demo3 },
    { path: '/demos/4', component: Demo4 },
  ],
})

createApp(App).use(router).mount('#app')
