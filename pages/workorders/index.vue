<!-- 
  reuse <work-order-system> component since 
  both root index.vue and /workorders/index.vue utilize it
-->
<template>
  <work-order-system v-if="!loading" :statuses="statuses" :persons="persons"></work-order-system>
</template>

<script setup>
import { useAuthStore } from '~/store/auth';
import axios from 'axios'
import { capitalizeFirstLetter } from '~/helpers/capitalizeFirstLetter.js';


const authStore = useAuthStore()
const { $msal } = useNuxtApp()
const runtimeConfig = useRuntimeConfig()
const statuses = ref()
const persons = ref()
const loading = ref(true)

onBeforeMount(async () => {
  try {
    const response = await axios.get(`${runtimeConfig.public.API_URL}/statuses`)
      statuses.value = response.data.data.map((item) => {
        return {
          title: capitalizeFirstLetter(item.name),
          value: item.name,
          id: item.id
        }
      })
  } catch (err) {
    console.log(err)
  }

  try {
    const response = await axios.get(`${runtimeConfig.public.API_URL}/persons`)
      persons.value = response.data.data.map((item) => {
        return {
          title: item.name,
          value: item.id
        }
      })
      persons.value.push({'title': '-- None --', 'value': '0'})

      // sort persons list
    persons.value = persons.value.sort((a, b) => 
      a.title.localeCompare(b.title))

  } catch (err) {
    console.log(err)
  }

  loading.value = false
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