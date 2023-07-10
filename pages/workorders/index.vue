<!-- 
  generic template to accept a record ID and then 
  pass to form component to render form data 
-->
<template>
  <div>
    <form-component-work-order form-action="edit" :record-id="route.query.id" :clickUpUserInfo="clickUpUserInfo" @close="close"></form-component-work-order>
  </div>
</template>

<script setup>
import axios from 'axios'
import { useAuthStore } from '~/store/auth';

const route = useRoute()
const clickUpUserInfo = ref()
const runtimeConfig = useRuntimeConfig()
const authStore = useAuthStore()
const { $msal } = useNuxtApp()

function close() {
  navigateTo('/')
}

onMounted(async () => {
  await $msal.handleRedirectPromise()
  if(!authStore.loggedIn) {
      await signIn()
  }
  loadClickUpUserInfo()
})

function loadClickUpUserInfo() {
  axios.get(`${runtimeConfig.public.API_URL}/members/?email=` + authStore.currentUser.username.toLowerCase())
  .then((response) => {
    clickUpUserInfo.value = response.data.data[0]
  })
  .catch(err => console.log(err))
}

</script>

<style scoped>

</style>