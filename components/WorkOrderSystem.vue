<template>
  <!-- TODO:find where 'class="bg-deep-purple"' is defined -->
  <v-navigation-drawer
    color="#428086"
    theme="dark"
    v-model="drawer"
    clipped 
    hide-overlay
  >
    <v-list color="transparent">
      <v-list-item prepend-icon="mdi-account-box" title="My work orders" @click="toggleShowUsersWorkOrders(true)"></v-list-item>
      <v-list-item prepend-icon="mdi-account-box-multiple" title=" All work orders" @click="toggleShowUsersWorkOrders(false)"></v-list-item>
      <v-list-item prepend-icon="mdi-format-list-bulleted" title="Not completed" @click="toggleShowCompleted(false)"></v-list-item>
      <v-list-item prepend-icon="mdi-playlist-check" title="Completed" @click="toggleShowCompleted(true)"></v-list-item>
      <v-list-item prepend-icon="mdi-form-select" title="Add New Work Order" @click="editItem(item)"></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar app clipped-left dark color="#92D5D5">
    <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    <v-toolbar-title>Work Order System</v-toolbar-title>
    <AuthN></AuthN>
  </v-app-bar>

  <v-container v-if="clickUpUserInfo" fluid>
    <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      label="Search (TBD)"
      single-line
      density="comfortable"
      hide-details
      disabled
    ></v-text-field>

    <!-- <div v-if="!clickUpUserInfo.length">
      <p>Please register for a KAI ClickUp account to use this application</p>
    </div> -->
    <!-- <div v-else>  -->
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
        <!-- <v-toolbar flat> -->

          <v-dialog v-model="dialog" max-width="800px">
            <!-- <template v-slot:activator="{ props }">
              <v-col class="text-center">
                <v-btn color="primary" dark class="mb-2" v-bind="props">
                  Add New Work Order
                </v-btn>
              </v-col>
            </template> -->

            <form-component form-action="new" :clickUpUserInfo="clickUpUserInfo" @close="close()"></form-component>
          </v-dialog>
        <!-- </v-toolbar> -->
      </template>

      <template v-slot:item.creator="{ item }">
        {{ item.raw.creator.username }}
      </template>

      <template v-slot:item.assignees="{ item }">
        <v-chip v-for="assignee in item.raw.assignees">{{ (!assignee.username) ? assignee.email : assignee.username }}</v-chip>
      </template>

      <template v-slot:item.watchers="{ item }">
        <v-chip v-for="watcher in item.raw.watchers">{{ (!watcher.username) ? watcher.email : watcher.username }}</v-chip>
      </template>

      <template v-slot:item.tags="{ item }">
        <!-- <v-chip>{{ item.raw.tags }}</v-chip> -->
        <v-chip v-for="tag in item.raw.tags">{{ tag }}</v-chip>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip :color="item.raw.status_color">
          {{ capitalizeFirstLetter(item.raw.status) }}
        </v-chip>
      </template>

      <template v-slot:item.priority="{ item }">
        <v-chip v-if="item.raw.priority" :color="getPriorityColor(item.raw.priority)">
          {{ capitalizeFirstLetter(item.raw.priority.priority) }}
        </v-chip>
      </template>

      <template v-slot:item.due_date="{ item }">
        <v-chip v-if="item.raw.due_date" :color="getDueDateColor(item.raw.due_date, item.raw.status)">
          {{ convertToDate(item.raw.due_date, "table") }}
          </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <NuxtLink :to="'/workorders?id=' + item.raw.id" target="_blank" title="Edit work order">
          <v-icon size="small" class="me-2">mdi-pencil</v-icon>
        </NuxtLink>
      </template>

      <template v-slot:bottom v-if="!showFooter"></template>
    </v-data-table-server>
  </v-container>
  
  <v-container>
    <v-row justify="center" align="center">
      <v-btn class="rounded-0" flat :disabled="previousPageBtnDisabled" @click="decrementPage">Previous page</v-btn>
      <v-btn class="rounded-0" flat :disabled="nextPageBtnDisabled" @click="incrementPage">Next page</v-btn>
    </v-row>
  </v-container>
  <!-- </div> -->
</template>

<script setup>
import { ref, nextTick, watch, toRaw } from 'vue'
import axios from 'axios'
import { useAuthStore } from '~/store/auth';
import { convertToDate, dateToISOStr, hoursToMilliseconds } from '~/helpers/datetimeConversions.js';
import { capitalizeFirstLetter } from '~/helpers/capitalizeFirstLetter.js';

const runtimeConfig = useRuntimeConfig()
const authStore = useAuthStore()
const dialog = ref(false)
const itemsPerPage = ref(100)
const loading = ref(true)
const totalItems = ref(0)
const showFooter = ref(false)
const page = ref(0)
const lastPage = ref(false)
const data = ref([])
const search = ref('')
const filterByUser = ref(true)
const showCompleted = ref(false)
const drawer = ref(false)
const clickUpUserInfo = ref()
const statuses = ref([])

const headers = [
  { title: 'Name', key: 'name', align: 'start', sortable: false, width: '25%' },
  { title: 'Project', key: 'project', align: 'start', sortable: false },
  { title: 'Created By', key: 'creator', align: 'start', sortable: false },
  { title: 'Assignee(s)', key: 'assignees', align: 'start', sortable: false },
  { title: 'Type', key: 'tags', align: 'start', sortable: false },
  { title: 'Status', key: 'status', align: 'center', sortable: false },
  { title: 'Priority', key: 'priority', align: 'center', sortable: false },
  { title: 'Due Date', key: 'due_date', align: 'center', sortable: false },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
]

// no longer used, but keep for reference just in case...
// const FakeAPI = {
//   async fetch({ page, itemsPerPage, sortBy }) {
//     return new Promise(resolve => {
//       setTimeout(() => {
//         const start = (page - 1) * itemsPerPage
//         const end = start + itemsPerPage
//         const items = serverItems.slice()

//         if (sortBy.length) {
//           const sortKey = sortBy[0].key
//           const sortOrder = sortBy[0].order
//           items.sort((a, b) => {
//             const aValue = a[sortKey]
//             const bValue = b[sortKey]
//             return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
//           })
//         }

//         const paginated = items.slice(start, end)

//         resolve({ items: paginated, total: items.length })
//       }, 500)
//     })
//   },
// }

// computed value to disable / enable the "Previous page" button
const previousPageBtnDisabled = computed(() => {
  return (loading.value) ? true : (page.value === 0) ? true : false
})

// computed value to disable / enable the "Next page" button
const nextPageBtnDisabled = computed(() => {
  return (loading.value) ? true : (lastPage.value) ? true : false
})

// computed value for work order submit progress messages
const onSubmitMsg = computed(() => {
  switch(submitStatus.value) {
    case 'submitting':
      return 'Submitting new work order...'
    case 'internal_api_error':
      return 'There was an issue with the API.'
    case 'connection_failure':
      return 'There was an issue submitting your form. Please try again.'
    case 'success':
      return 'Work order submitted successfully.'
    default:
      return ''
  }
})

// computed value for toggling group-by behavior
// if we still plan to incorporate grouping, then we will need to pass a :group-by="groupBy" prop in the <v-data-table-server> component
const groupBy = computed(() => {
  if(!filterByUser.value){
    return [{key: 'assignees'}]
  }
})

// form field validation rules
const rules =
{
  required: v => !!v || 'Field is required',
  length: v => v.length >= 3 || 'Minimum length is 3 characters',
  select: v => !!v || 'Select a valid option',
  due_date: v => !!v || 'Date must be selected',
  due_date_threshold: v => dateValidation(v) || 'Date must be 2 business days from today',
}

onBeforeMount(() => {
  loadClickUpUserInfo()
})

function loadClickUpUserInfo() {
  axios.get(`${runtimeConfig.public.API_URL}/members/?email=` + authStore.currentUser.username.toLowerCase())
  .then((response) => {
    clickUpUserInfo.value = response.data.data[0]
  })
  .catch(err => console.log(err))
}


// mounted life-cycle hook
onMounted(() => {
  loadStatuses()
})

// function loadItems({ page }) {
function loadItems() {
  loading.value = true
  let axiosGetRequestURL = `${runtimeConfig.public.API_URL}/tasks/?page=` + page.value

  // set assignee filter
  if(filterByUser.value) axiosGetRequestURL = axiosGetRequestURL + `&assignees[]=` + clickUpUserInfo.value.id

  // set display completed work order filter
  if(showCompleted.value) {
    axiosGetRequestURL = axiosGetRequestURL + `&statuses[]=complete`
  } else {
    /* 
      since the API doesn't have the capability to accept a NOT operator in the query string,
      we will need to filter out status of "complete" here.
      if/when it does, then mimic assignee filter logic.
    */
    const statusesArray = statuses.value.filter(e => e.value !== 'complete')

    let statusQueryStr = ''
    statusesArray.forEach(element => 
      statusQueryStr += '&statuses[]=' + encodeURIComponent(toRaw(element).value)
    )

    axiosGetRequestURL = axiosGetRequestURL + statusQueryStr
  }

  axios.get(axiosGetRequestURL)
  .then((response) => {
    // data.value = response.data.data.slice(0, 10).map((item) => {
    data.value = response.data.data.map((item) => {
      return {
        assignees: item.assignees,
        creator: item.creator,
        list: item.list.id,
        description: item.description,
        due_date: item.due_date,
        folder: item.folder.id,
        id: item.id,
        links: item.links,
        name: item.name,
        priority: item.priority,
        project: item.folder.name + ' | ' + item.list.name,
        status: item.status.status,
        status_color: item.status.color,
        tags: item.tags,
        time_estimate: item.time_estimate,
        url: item.url,
        watchers: item.watchers
      }
    })
    lastPage.value = response.data.last_page
    totalItems.value = response.data.data.length
    loading.value = false
  })
  .catch(err => console.log(err))
}

function loadStatuses() {
  axios.get(`${runtimeConfig.public.API_URL}/statuses`)
  .then((response) => {
    statuses.value = response.data.data.map((item) => {
      return {
        title: capitalizeFirstLetter(item.name),
        value: item.name,
      }
    })
  })
  .catch(err => console.log(err))
}

function editItem(item) {
  dialog.value = true
}

function close() {
  dialog.value = false
}

function toggleShowUsersWorkOrders (value) {
  if(value != filterByUser.value) {
    filterByUser.value = (value) ? true : false
    loadItems()
  } else {
    return
  }
}

function toggleShowCompleted (value) {
  if(value != showCompleted.value) {
    showCompleted.value = (value) ? true : false
    loadItems()
  } else {
    return
  }
}

function incrementPage() {
  page.value = (page.value + 1)
}

function decrementPage() {
  page.value = (page.value - 1)
}

// priority color method for v-chip component
function getPriorityColor (priority) {
  switch(priority.priority) {
    case 'urgent':
      return '#f50000'
    case 'high':
      return '#ffcc00'
    case 'normal':
      return '#6fddff'
    case 'low':
      return '#d8d8d8'
    default:
      return ''
  }
}

function getDueDateColor(rawDateTime, status) {
  let color = ""
  const convertedRawDateTime = Number(rawDateTime)
  const date = new Date(convertedRawDateTime)

  const todayInMS = new Date()
  const todayPlusFiveDays = Number(todayInMS) + 432000000

  // if task is not complete, then set color
  // red for overdue (or due today), yellow for due within 5 days
  if(status != "complete") {
    if (todayInMS >= date) {
      color = "#f50000"
    } else if (todayPlusFiveDays > date) {
      color = "#ffcc00"
    }
  }

  return color
}

</script>

<style scoped>

</style>