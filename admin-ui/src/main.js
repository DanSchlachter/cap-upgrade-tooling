import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import ListView from './views/ListView.vue'
import EditView from './views/EditView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: ListView },
    { path: '/new', component: EditView },
    { path: '/edit/:id', component: EditView, props: true },
  ],
})

createApp(App).use(router).mount('#app')
