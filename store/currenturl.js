import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCurrentUrlStore = defineStore('currentUrlStore', () => {
    const url = ref({
        href: '',
        type: ''
    })

    const changeUrl = (newUrl, type) => {
        url.value.href = newUrl
        url.value.type = type
    }

    return {
        url,
        changeUrl
    }
})

