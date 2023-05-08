<template>
  <!-- use conditional rendering for logged in experience -->
  <div v-if="!authStore.loggedIn">
    <div class="d-flex align-center flex-column mt-5">
      <h2>ClickUp Integration App</h2>
      <p>Please login using your Active Directory credentials</p>
      <br />
      <v-btn @click.stop="signInAction" v-if="!authStore.loggedIn">Sign In</v-btn>
    </div>
  </div>
  <div v-else>
    <data-table-component></data-table-component>
  </div>
</template>

<script setup lang="ts">
  import { useAuthStore } from '~/store/auth';
  // import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  // const { currentUser } = storeToRefs(authStore)

  async function signInAction() {
    await signIn()
  }
</script>

<style scoped>

</style>