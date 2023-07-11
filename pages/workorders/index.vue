<!-- 
  reuse <work-order-system component> since 
  both root index.vue and /workorders/index.vue utilize it
-->
<template>
  <work-order-system></work-order-system>
</template>

<script setup>
import { useAuthStore } from '~/store/auth';

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
})

</script>

<style scoped>

</style>