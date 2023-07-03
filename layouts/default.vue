<template>
  <div v-if="!authStore.loggedIn">
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
  <div v-else>
    <v-layout>
      <v-main style="min-height: 300px;">
        <div>
          <!-- TODO:find where 'class="bg-deep-purple"' is defined -->
          <v-navigation-drawer
            color="#428086"
            theme="dark"
            v-model="drawer"
            clipped 
            hide-overlay
          >
            <div class="text-center">
              <nuxt-img src="/images/kai-logo.svg" sizes="sm:100vw md:50vw lg:400px" width="200px" class="mt-3 mb-1 pa-1" style="background:white;"/>
            </div>
            
            <v-list color="transparent">
              <v-list-item prepend-icon="mdi-account-box" @click="toggleShowUsersWorkOrders(true)">
                <v-list-item-title title="Show my work orders">My work orders</v-list-item-title>
              </v-list-item>

              <v-list-item prepend-icon="mdi-account-box-multiple" @click="toggleShowUsersWorkOrders(false)">
                <v-list-item-title title="Show all work orders">All work orders</v-list-item-title>
              </v-list-item>

              <v-list-item prepend-icon="mdi-format-list-bulleted" @click="toggleShowCompleted(false)">
                <v-list-item-title title="Show non-completed work orders">Not completed</v-list-item-title>
              </v-list-item>

              <v-list-item prepend-icon="mdi-playlist-check" @click="toggleShowCompleted(true)">
                <v-list-item-title title="Show completed orders">Completed</v-list-item-title>
              </v-list-item>

              <v-list-item prepend-icon="mdi-form-select" @click="openModal(item)">
                <v-list-item-title title="Add a new work order">Add New Work Order</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-navigation-drawer>

          <v-app-bar flat app clipped-left dark color="#92D5D5">
            <v-app-bar-nav-icon @click.stop="drawer = !drawer" title="Toggle menu display"></v-app-bar-nav-icon>
            <v-toolbar-title>Work Order System</v-toolbar-title>
            <AuthN></AuthN>
          </v-app-bar>

          <slot />
        </div>
      </v-main>
    </v-layout>
  </div>
</template>

<script setup>
  import { useAuthStore } from '~/store/auth';
  // import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  // const { currentUser } = storeToRefs(authStore)

  const drawer = ref(true)

  // use provide/inject pattern to send data to child component
  const showModal = ref(false)
  provide('dialog', showModal)

  const filterByUser = ref(true)
  provide('filterByUser', filterByUser)

  const showCompleted = ref(false)
  provide('showCompleted', showCompleted)

  async function signInAction() {
    await signIn()
  }

  function openModal() {
    showModal.value = true
  }

  function toggleShowUsersWorkOrders(value) {
    navigateTo('/')

    if(value != filterByUser.value) {
      filterByUser.value = (value) ? true : false
    } else {
      return
    }
  }

  function toggleShowCompleted(value) {
    navigateTo('/')

    if(value != showCompleted.value) {
      showCompleted.value = (value) ? true : false
    } else {
      return
    }
}
</script>

<style scoped>
  a {
    color: #000000;
  }
  .router-link-exact-active {
    color: #000000;
  }

  /* .container {
    height: 100vh;
    background-image: linear-gradient(#ffffff, #428086);
  } */

  .centered-element {
    position: absolute; 
    top:50%; 
    transform: translateY(-50%);
  }
</style>