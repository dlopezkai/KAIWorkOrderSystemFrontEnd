import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserInfoStore = defineStore('userInfoStore', () => {
    const userInfo = ref({
        id: '',
        name: '',
        email: ''
    })

    const setUserInfo = (id, name, email) => {
        userInfo.value.id = id
        userInfo.value.name = name
        userInfo.value.email = email
    }

    return {
        userInfo,
        setUserInfo
    }
})