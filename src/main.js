import { createApp } from 'vue'
import Root from './Root.vue'

import.meta.glob('./css/**/*.css', { eager: true })

createApp(Root).mount('#app')
