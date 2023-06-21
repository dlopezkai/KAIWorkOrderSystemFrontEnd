<!-- 
  generic template to accept a record ID and then 
  pass to form component to render form data 
-->
<template>
  <div>
    <form-component :record-id="route.query.id" :clickUpUserInfo="clickUpUserInfo"></form-component>
  </div>
</template>

<script setup>
import axios from 'axios'
import { useAuthStore } from '~/store/auth';
import FormComponent from '~/components/FormComponent'

const route = useRoute()
const clickUpUserInfo = ref()
const runtimeConfig = useRuntimeConfig()
const authStore = useAuthStore()
const { $msal } = useNuxtApp()

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