import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCurrentUrlStore = defineStore('currentUrlStore', () => {
    const url = ref({
        href: '',
        pathname: '',
        pathDisplayText: '',
        isRoot: false,
        type: ''
    })

    const changeUrl = (newUrl, pathname, type) => {
        url.value.href = newUrl
        url.value.pathname = pathname
        url.value.pathDisplayText = (pathname === '/workorders') ? 'work orders' : pathname.replace(/\//g,'')
        url.value.isRoot = ( pathname == '/' || pathname == '/workorders' ) ? true : false
        url.value.type = type
    }

    return {
        url,
        changeUrl
    }
})

