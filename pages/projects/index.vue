<template>
  <v-container v-if="userInfoStore.userInfo.role === 'admin'" fluid fill-height>
    <v-layout child-flex>
      <v-card v-if="route.query.id" width="100vw">
        <form-component-project form-action="edit" :record-id="route.query.id" @close="close()" @closeAndReload="closeAndReload()"></form-component-project>
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
          v-model:items-per-page="itemsPerPage"
          :headers="headers" 
          :items-length="totalItems"
          :items="data" 
          :loading="loading" 
          class="elevation-1 overflow-y-auto"
          style="max-height: 80vh"
          density="comfortable"
          :search="search"
          @update:options="loadItems"
          :items-per-page-options="[
            {value: 10, title: '10'},
            {value: 25, title: '25'},
            {value: 50, title: '50'},
            {value: 100, title: '100'},
          ]"
        >
          <template v-slot:top>
            <v-dialog v-model="dialog" max-width="800px">
              <form-component-project form-action="new" @close="close()" @closeAndReload="closeAndReload()"></form-component-project>
            </v-dialog>
          </template>

          <template v-slot:item.subtasks="{ item }">
            <v-chip v-for="subtask in item.raw.subtasks">{{ subtask.name }}</v-chip>
          </template>

          <template v-slot:item.isarchived="{ item }">
            {{ (item.raw.isarchived == 0) ? 'No' : 'Yes' }}
          </template>

          <template v-slot:item.actions="{ item }">
            <NuxtLink v-if="item.raw.isarchived == 1" :to="'/projects?id=' + item.raw.id" title="View archived project info">
              <v-icon size="small" class="me-2">mdi-list-box-outline</v-icon>
            </NuxtLink>
            <NuxtLink v-else :to="'/projects?id=' + item.raw.id" title="Edit project info">
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
import { useAuthStore } from '~/store/auth';
import { useNavMenuStore } from '~/store/navMenuStore'
import { useUserInfoStore } from '~/store/userInfoStore'

const authStore = useAuthStore()
const navMenuStore = useNavMenuStore()
const userInfoStore = useUserInfoStore()
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
  { title: 'Project', key: 'project', align: 'start', sortable: false },
  { title: 'Subtask(s)', key: 'subtasks', align: 'start', sortable: false },
  { title: 'Archived', key: 'isarchived', align: 'center', sortable: false },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
]


onBeforeMount(async () => {
  if(userInfoStore.userInfo.id.length < 1) {
    try {
      const response = await axios.get(`${runtimeConfig.public.API_URL}/persons?email=` + authStore.currentUser.username.toLowerCase())
      userInfoStore.setUserInfo(response.data.data[0].id, response.data.data[0].name, response.data.data[0].email, response.data.data[0].role)
    } catch (err) {
      console.log(err)
    }
  }

  // redirect user back to workorder if they're not an admin
  if (userInfoStore.userInfo.role !== 'admin') {
    navigateTo('/workorders')
  }
})

onMounted(() => {
  setMenuItems()
})

watch(() => route.query, () => 
  setMenuItems()
)


function loadItems() {
  loading.value = true
  let axiosGetRequestURL = `${runtimeConfig.public.API_URL}/projects?page=` + page.value + `&page_size=` + itemsPerPage.value

  axios.get(axiosGetRequestURL)
  .then((response) => {
    data.value = response.data.data.map((item) => {
      return {
        id: item.id,
        project: item.name,
        subtasks: item.subtasks,
        isarchived: item.isarchived,
      }
    })
    totalItems.value = response.data.total
    loading.value = false
  })
  .catch(err => console.log(err))
}


function close() {
  if(route.query.id) {
    navigateTo('/projects')
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
      { 'label': 'Projects', 'destination': '/projects', 'icon': 'mdi-keyboard-backspace' },
    ]
  } else {
    navigationItems = [
      { 'label': 'Work Orders', 'destination': '/workorders', 'icon': 'mdi-keyboard-backspace' },
    ]
  }

  navMenuStore.setTableName('Projects')
  navMenuStore.setMenuItems(navigationItems, settingsItems, filterItems)
  navMenuStore.setCanAddNewRecord(true)
}
</script>

<style lang="scss" scoped>

</style>