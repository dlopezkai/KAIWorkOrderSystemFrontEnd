import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCurrentUrlStore = defineStore('currentUrlStore', () => {
    const url = ref({
        href: ''
    })

    const changeUrl = (newUrl) => {
        url.value.href = newUrl
    }

    return {
        url,
        changeUrl
    }
})

