<template>
    <v-container fluid fill-height>
      <v-layout child-flex>
        <v-card v-if="route.query.id" width="100vw">
          <form-component-user form-action="edit" :record-id="route.query.id" @close="close()" @closeAndReload="closeAndReload()"></form-component-user>
        </v-card>
        <v-card v-else width="100vw">
          <!-- <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search (TBD)"
            single-line
            density="comfortable"
            hide-details
            disabled
          ></v-text-field> -->
  
          <!-- to make row clickable again, add @click:row="(pointerEvent, {item}) => editItem(item.raw)" -->
          <v-data-table-server
            v-model:page="page"
            :headers="headers" 
            :items-length="totalItems"
            :items="data" 
            :loading="loading" 
            class="elevation-1 overflow-y-auto"
            style="max-height: 80vh"
            density="comfortable"
            :search="search"
            @update:options="loadItems"
          >
            <template v-slot:top>
              <v-dialog v-model="dialog" max-width="800px">
                <form-component-user form-action="new" @close="close()" @closeAndReload="closeAndReload()"></form-component-user>
              </v-dialog>
            </template>
  
            <template v-slot:item.actions="{ item }">
              <NuxtLink :to="'/users?id=' + item.raw.id" title="Edit user info">
                <v-icon size="small" class="me-2">mdi-pencil</v-icon>
              </NuxtLink>
            </template>
  
          </v-data-table-server>
        </v-card>
      </v-layout>
    </v-container>
  </template>
  
  <script setup>
  import axios from 'axios'
  import { useNavMenuStore } from '~/store/navMenuStore'
  
  const navMenuStore = useNavMenuStore()
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  const dialog = inject('dialog')
  const isRecordPage = inject('isRecordPage')
  const itemsPerPage = ref(10)
  const loading = ref(true)
  const totalItems = ref(0)
  const page = ref(1)
  const data = ref([])
  
  const headers = [
    { title: 'ID', key: 'id', align: 'start', sortable: false },
    { title: 'Name', key: 'name', align: 'start', sortable: false },
    { title: 'E-Mail', key: 'email', align: 'start', sortable: false },
    { title: 'Role', key: 'role', align: 'start', sortable: false },
    { title: 'Actions', key: 'actions', align: 'center', sortable: false },
  ]
  
  
  onMounted(() => {
    setMenuItems()
  })
  
  watch(() => route.query, () => 
    setMenuItems()
  )
  
  
  function loadItems() {
    loading.value = true
    // let axiosGetRequestURL = `${runtimeConfig.public.API_URL}/projects?page=` + page.value + `&page_size=` + itemsPerPage.value
    let axiosGetRequestURL = `${runtimeConfig.public.API_URL}/persons`
  
    axios.get(axiosGetRequestURL)
    .then((response) => {
      data.value = response.data.data.map((item) => {
        return {
          id: item.id,
          name: item.name,
          role: item.role,
          email: item.email,
        }
      })
      totalItems.value = response.data.total
      loading.value = false
    })
    .catch(err => console.log(err))
  }
  
  
  function close() {
    if(route.query.id) {
      navigateTo('/users')
    } else {
      dialog.value = false
    }
  }
  
  
  function closeAndReload() {
    dialog.value = false
    loadItems()
  }
  
  
  function setMenuItems() {
    let navigationItems = []
    let settingsItems = []
    let filterItems = []
  
    if (isRecordPage.value) {
      navigationItems = [
        { 'label': 'Users', 'destination': '/users', 'icon': 'mdi-keyboard-backspace' },
      ]
    } else {
      navigationItems = [
        { 'label': 'Work Orders', 'destination': '/workorders', 'icon': 'mdi-keyboard-backspace' },
      ]
    }
  
    navMenuStore.setTableName('Users')
    navMenuStore.setMenuItems(navigationItems, settingsItems, filterItems)
  }
  </script>
  
  <style lang="scss" scoped>
  
  </style>