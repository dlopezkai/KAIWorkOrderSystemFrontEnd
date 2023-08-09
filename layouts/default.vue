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
    <!-- 
      only show this loader on non-record pages since those have their own loader.
      maybe look at integrating later on.
     -->
    <v-overlay v-if="!isRecordPage" v-model="displayLoadingMessage" class="align-center justify-center" persistent>
      <v-container style="height: 400px;">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            <v-card style="font-family:'Open Sans;'">
              <v-card-text>Retrieving data...</v-card-text>
              <v-progress-circular color="#92D5D5" indeterminate size="50" class="mb-4"></v-progress-circular>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-overlay>

    <v-layout>
      <v-main style="min-height: 300px;">
        <div>
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
              <!-- navigation group -->
              <v-row v-if="navMenuStore.menuItems.navigationItemsGroup.length > 0">
                <v-col>
                  <v-list-subheader>{{ navMenuStore.table.name }}</v-list-subheader>
                </v-col>
                <v-col v-if="!isRecordPage && navMenuStore.canAddNewRecord" class="text-right pr-6">
                  <v-btn icon variant="tonal" size="x-small" @click="openModal">
                    <v-icon
                      color="white"
                      icon="mdi-plus"
                    ></v-icon>
                  </v-btn>
                </v-col>
              </v-row>
              <v-list-item v-for="menuItem in navMenuStore.menuItems.navigationItemsGroup" :prepend-icon="menuItem.icon" @click="navigateTo(menuItem.destination)">
                <v-list-item-title :title="menuItem.label" v-text="menuItem.label"></v-list-item-title>
              </v-list-item>


              <!-- filters group -->
              <v-row v-if="navMenuStore.menuItems.filterItemsGroup.length > 0">
                <v-col>
                  <v-list-subheader>{{ navMenuStore.table.name }}</v-list-subheader>
                </v-col>
                <v-col class="text-right pr-6">
                  <v-btn icon variant="tonal" size="x-small" @click="openModal">
                    <v-icon
                      color="white"
                      icon="mdi-plus"
                    ></v-icon>
                  </v-btn>
                </v-col>
              </v-row>
              <v-list-item v-for="menuItem in navMenuStore.menuItems.filterItemsGroup" :prepend-icon="menuItem.icon" @click="filteringMethod(menuItem.filter_name)">
                <v-list-item-title :title="`Filter by ` + menuItem.label" v-text="menuItem.label"></v-list-item-title>
              </v-list-item>


              <!-- settings group -->
              <v-divider v-if="navMenuStore.menuItems.settingsItemsGroup.length > 0"></v-divider>
              <v-list-subheader v-if="navMenuStore.menuItems.settingsItemsGroup.length > 0">Settings</v-list-subheader>
              <v-list-item v-for="menuItem in navMenuStore.menuItems.settingsItemsGroup" :prepend-icon="menuItem.icon" @click="navigateTo(menuItem.destination)">
                <v-list-item-title :title="`Go to ` + menuItem.label" v-text="menuItem.label"></v-list-item-title>
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
  import axios from 'axios'
  import { useAuthStore } from '~/store/auth';
  // import { storeToRefs } from 'pinia'
  import { useNavMenuStore } from '~/store/navMenuStore'
  import { useUserInfoStore } from '~/store/userInfoStore'
  import { capitalizeFirstLetterOfEachWord } from '~/helpers/capitalizeFirstLetter.js';

  const runtimeConfig = useRuntimeConfig()
  const authStore = useAuthStore()
  // const { currentUser } = storeToRefs(authStore)
  const navMenuStore = useNavMenuStore()
  const userInfoStore = useUserInfoStore()
  const route = useRoute()
  const drawer = ref(true)

  const displayLoadingMessage = ref(false)
  provide('displayLoadingMessage', displayLoadingMessage)

  // use provide/inject pattern to send data to child component
  const showModal = ref(false)
  provide('dialog', showModal)

  // using an incremental counter to trigger event since boolean is not efficient here
  const filterByUserTrigger = ref(0)
  provide('filterByUserTrigger', filterByUserTrigger)

  const showNonCompletedTrigger = ref(0)
  provide('showNonCompletedTrigger', showNonCompletedTrigger)

  const showCompletedTrigger = ref(0)
  provide('showCompletedTrigger', showCompletedTrigger)

  const isRecordPage = ref(false)
  provide('isRecordPage', isRecordPage)


  onBeforeMount(async () => {
    // get logged-in user's info from DB 
    getUserInfo()

    // initial page load check for query string
    recordPageCheck()
	})

  // DO NOT DELETE THE BELOW WATCHERS - they are no needed if page is reloaded
  // checks for query string param while mounted
  watch(() => route.query, () => 
    recordPageCheck()
  )


  async function signInAction() {
    await signIn()
  }


  async function getUserInfo() {
    if(authStore.currentUser) {
      try {
        const response = await axios.get(`${runtimeConfig.public.API_URL}/persons?email=` + authStore.currentUser.username.toLowerCase())
        userInfoStore.setUserInfo(response.data.data[0].id, response.data.data[0].name, response.data.data[0].email, response.data.data[0].role)
      } catch (err) {
        console.log(err)
      }
    }
  }


  function openModal() {
    showModal.value = true
  }

  // increment counter to guarantee new value in component watcher 
  function filteringMethod(filter_name) {
    if (filter_name === 'filterByUser') {
      filterByUserTrigger.value++
    }

    if (filter_name === 'showNonCompleted') {
      showNonCompletedTrigger.value++
    }

    if (filter_name === 'showCompleted') {
      showCompletedTrigger.value++
    }
  }


  function recordPageCheck() {
    isRecordPage.value = (route.query.hasOwnProperty('id')) ? true : false
  }

</script>

<style scoped>
  a {
    color: #000000;
  }
  .router-link-exact-active {
    color: #000000;
  }

  .centered-element {
    position: absolute; 
    top:50%; 
    transform: translateY(-50%);
  }
</style>