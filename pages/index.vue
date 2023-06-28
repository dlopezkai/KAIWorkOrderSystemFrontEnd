<template>
  <!-- use conditional rendering for logged in experience -->
  <!-- <div v-if="!authStore.loggedIn">
    <div class="container d-flex align-center flex-column">
      <div class="centered-element">
        <v-card flat class="text-center">
          <v-card-text>
            <nuxt-img src="/images/kai-logo.svg" sizes="sm:100vw md:50vw lg:400px" width="200px" class="mb-5"/>
            <h2>Work Order System</h2>
            <br />
            <p>Please login using your Active Directory credentials</p>
            <br />
            <v-btn @click.stop="signInAction" v-if="!authStore.loggedIn">Sign In</v-btn>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
  <div v-else> -->
    <work-order-system></work-order-system>
  <!-- </div> -->
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
  .container {
    height: 100vh;
    background-image: linear-gradient(#ffffff, #428086);
  }

  .centered-element {
    position: absolute; 
    top:50%; 
    transform: translateY(-50%);
  }
</style>