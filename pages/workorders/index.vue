<!-- 
  reuse <work-order-system> component since 
  both root index.vue and /workorders/index.vue utilize it
-->
<template>
  <work-order-system v-if="!loading" :userInfo="userInfo"></work-order-system>
</template>

<script setup>
import { useAuthStore } from '~/store/auth';
import axios from 'axios'

const authStore = useAuthStore()
const { $msal } = useNuxtApp()
const runtimeConfig = useRuntimeConfig()
const userInfo = ref()
const loading = ref(true)

onBeforeMount(async () => {
  try {
    const response = await axios.get(`${runtimeConfig.public.API_URL}/persons?email=` + authStore.currentUser.username.toLowerCase())
    userInfo.value = response.data.data[0]
    loading.value = false
  } catch (err) {
    console.log(err)
  }
})

onMounted(async () => {
  await $msal.handleRedirectPromise()
  if(!authStore.loggedIn) {
      await signIn()
  }
})

</script>

<style scoped>

</style>