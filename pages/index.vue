<template>
  <!-- use conditional rendering for logged in experience -->
  <div v-if="!authStore.loggedIn" class="d-flex align-center flex-column mt-5">
    <h2>ClickUp Integration App</h2>
    <p>Please login using your Active Directory credentials</p>
  </div>
  <div v-else class="d-flex align-center flex-column">
    <data-table-comp-server></data-table-comp-server>
    <!-- <data-table-comp-crud></data-table-comp-crud> -->
  </div>
</template>

<script setup lang="ts">
  import { useAuthStore } from '~/store/auth';
  // import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  // const { currentUser } = storeToRefs(authStore)
</script>

<style scoped>

</style>