<!-- 
  generic template to accept a record ID and then pass to 
  form component to render form data 
-->
<template>
  <div>
    {{ route.params.id }}
    <form-component :record-id="route.params.id" :clickUpUserInfo="clickUpUserInfo"></form-component>
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
// const { $msal } = useNuxtApp()

onMounted(async () => {
  // need to convert to using query string param to make MSAL work properly
  // await $msal.handleRedirectPromise()
  // if(!authStore.loggedIn) {
  //     await signIn()
  // }
  loadClickUpUserInfo()
})

function loadClickUpUserInfo() {
  // axios.get(`${runtimeConfig.public.API_URL}/members/?email=` + authStore.currentUser.username.toLowerCase())
  axios.get(`${runtimeConfig.public.API_URL}/members/?email=david.lopez@kauffmaninc.com`)
  .then((response) => {
    clickUpUserInfo.value = response.data.data[0]
  })
  .catch(err => console.log(err))
}

</script>

<style scoped>

</style>