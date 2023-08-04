import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserInfoStore = defineStore('userInfoStore', () => {
    const userInfo = ref({
        id: '',
        name: '',
        email: '',
        role: ''
    })

    const setUserInfo = (id, name, email, role) => {
        userInfo.value.id = id
        userInfo.value.name = name
        userInfo.value.email = email
        userInfo.value.role = role
    }

    return {
        userInfo,
        setUserInfo
    }
})