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

            <!-- version 2 -->
            <v-list color="transparent">
              <!-- navigation group -->
              <v-list-subheader v-if="navMenuStore.menuItems.navigationItems.length > 0">Navigation</v-list-subheader>
              <v-list-item v-for="menuItem in navMenuStore.menuItems.navigationItems" :prepend-icon="menuItem.icon" @click=navigateTo(menuItem.destination)>
                <v-list-item-title v-text="menuItem.label"></v-list-item-title>
              </v-list-item>

              <!-- filters group -->
              <v-divider v-if="navMenuStore.menuItems.filterItemsGroup.length > 0"></v-divider>
              <v-list-subheader v-if="navMenuStore.menuItems.filterItemsGroup.length > 0">Table Filters</v-list-subheader>
              <v-list-item v-for="menuItem in navMenuStore.menuItems.filterItemsGroup" :prepend-icon="menuItem.icon" @click="filteringMethod(menuItem.filter_name, menuItem.filter_value)">
                <v-list-item-title v-text="menuItem.label"></v-list-item-title>
              </v-list-item>

              <!-- add record group -->
              <v-divider v-if="navMenuStore.menuItems.addRecordItems.length > 0"></v-divider>
              <v-list-subheader v-if="navMenuStore.menuItems.addRecordItems.length > 0">New Item Management</v-list-subheader>
              <v-list-item v-for="menuItem in navMenuStore.menuItems.addRecordItems" :prepend-icon="menuItem.icon" @click="openModal()">
                <v-list-item-title v-text="menuItem.label"></v-list-item-title>
              </v-list-item>
            </v-list>

            <!-- version 1 -->
            <!-- <v-list v-if="urlStore.url.type !== 'edit' && urlStore.url.isRoot" color="transparent">
              <v-list-item prepend-icon="mdi-account-box" @click="filterByUser = true">
                <v-list-item-title title="Show my work orders">My Work Orders</v-list-item-title>
              </v-list-item>

              <v-list-item prepend-icon="mdi-account-box-multiple" @click="filterByUser = false">
                <v-list-item-title title="Show all work orders">All Work Orders</v-list-item-title>
              </v-list-item>

              <v-list-item prepend-icon="mdi-format-list-bulleted" @click="showCompleted = false">
                <v-list-item-title title="Show non-completed work orders">Not Completed</v-list-item-title>
              </v-list-item>

              <v-list-item prepend-icon="mdi-playlist-check" @click="showCompleted = true">
                <v-list-item-title title="Show completed orders">Completed</v-list-item-title>
              </v-list-item> -->

              <!-- comment this <v-list-item> before merging -->
              <!-- <v-list-item prepend-icon="mdi-form-select" @click="navigateTo('/projects')">
                <v-list-item-title title="Manage projects">Manage Projects</v-list-item-title>
              </v-list-item> -->
            <!-- </v-list> -->

            <!-- <v-list color="transparent"> -->
              <!-- return links -->
              <!-- for all non-record pages -->
              <!-- <v-list-item v-if="urlStore.url.type !== 'edit' && !urlStore.url.isRoot" prepend-icon="mdi-keyboard-backspace" @click="navigateTo('/workorders')">
                <v-list-item-title title="Show work orders">Work Orders</v-list-item-title>
              </v-list-item> -->

              <!-- record pages -->
              <!-- <v-list-item v-if="urlStore.url.type === 'edit'" prepend-icon="mdi-keyboard-backspace" @click="navigateTo(urlStore.url.pathname)">
                <v-list-item-title :title="`Show ` + urlStore.url.pathDisplayText">{{ capitalizeFirstLetterOfEachWord(urlStore.url.pathDisplayText) }}</v-list-item-title>
              </v-list-item> -->


              <!-- modal toggles -->
              <!-- for all non-record pages -->
              <!-- <v-list-item v-if="urlStore.url.type !== 'edit' && urlStore.url.isRoot" prepend-icon="mdi-file-document-plus-outline" @click="openModal()">
                <v-list-item-title title="Add new work order">Add New Work Order</v-list-item-title>
              </v-list-item> -->

              <!-- record pages -->
              <!-- <v-list-item v-if="urlStore.url.type !== 'edit' && !urlStore.url.isRoot" prepend-icon="mdi-file-document-plus-outline" @click="openModal()">
                <v-list-item-title :title="`Add new ` + urlStore.url.pathDisplayText">Add New {{ capitalizeFirstLetterOfEachWord(urlStore.url.pathDisplayText).slice(0, -1) }}</v-list-item-title>
              </v-list-item> -->
            <!-- </v-list> -->
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
  // import { useCurrentUrlStore } from '~/store/currenturl'
  import { useNavMenuStore } from '~/store/navMenuStore'
  import { capitalizeFirstLetterOfEachWord } from '~/helpers/capitalizeFirstLetter.js';

  const authStore = useAuthStore()
  // const { currentUser } = storeToRefs(authStore)
  // const urlStore = useCurrentUrlStore()
  const navMenuStore = useNavMenuStore()
  const route = useRoute()
  const drawer = ref(true)

  // use provide/inject pattern to send data to child component
  const showModal = ref(false)
  provide('dialog', showModal)

  const filterByUser = ref(true)
  provide('filterByUser', filterByUser)

  const showCompleted = ref(false)
  provide('showCompleted', showCompleted)

  const pageType = ref('')
  provide('pageType', pageType)

  async function signInAction() {
    await signIn()
  }

  function openModal() {
    showModal.value = true
  }

  function filteringMethod(filter_name, filter_value) {
    if (filter_name === 'filterByUser') {
      filterByUser.value = filter_value
    }

    if (filter_name === 'showCompleted') {
      showCompleted.value = filter_value
    }
  }

  function recordPageCheck() {
    // return (route.query.hasOwnProperty('id')) ? urlStore.changeUrl(window.location.href, window.location.pathname, 'edit') : urlStore.changeUrl(window.location.href, window.location.pathname)

    pageType.value = (route.query.hasOwnProperty('id')) ? 'record' : 'table'

  }

	onBeforeMount(() => {
    // initial page load check for query string
    recordPageCheck()
	})

  // checks for query string param while mounted
  watch(() => route.query, () => 
    recordPageCheck()
  )
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