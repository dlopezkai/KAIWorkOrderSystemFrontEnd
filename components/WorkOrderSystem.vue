<template>
  <v-container fluid full-height>
    <v-layout child-flex>
      <v-card v-if="route.query.id" width="100vw">
        <form-component-work-order form-action="edit" :userInfo="props.userInfo" :record-id="route.query.id" @close="close()" @closeAndReload="closeAndReload()"></form-component-work-order>
      </v-card>
      <v-card v-else width="100vw">
        <div class="d-flex mb-2">
          <v-text-field
            v-model="searchString"
            prepend-icon="mdi-magnify"
            label="Search work orders"
            single-line
            density="comfortable"
            class="pr-5"
            hide-details
          ></v-text-field>

          <v-btn color="blue" class="rounded" @click="submitSearch()">Search</v-btn>
        </div>

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
              <form-component-work-order form-action="new" :userInfo="props.userInfo" @close="close()" @closeAndReload="closeAndReload()"></form-component-work-order>
            </v-dialog>
          </template>

          <template v-slot:item.creator="{ item }">
            {{ item.raw.creator.name }}
          </template>

          <template v-slot:item.assignees="{ item }">
            <v-chip v-for="assignee in item.raw.assignees">{{ assignee.name }}</v-chip>
          </template>

          <!-- <template v-slot:item.watchers="{ item }">
            <v-chip v-for="watcher in item.raw.watchers">{{ (!watcher.username) ? watcher.email : watcher.username }}</v-chip>
          </template> -->

          <template v-slot:item.tags="{ item }">
            <v-chip v-for="tag in item.raw.tags">{{ tag.name }}</v-chip>
          </template>

          <template v-slot:item.status="{ item }">
            <!-- need v-if since some statuses come in as NULL -->
            <v-chip v-if="item.raw.status" :color="item.raw.status_color">
              {{ capitalizeFirstLetter(item.raw.status.name) }}
            </v-chip>
          </template>

          <template v-slot:item.priority="{ item }">
            <v-chip v-if="item.raw.priority" :color="getPriorityColor(item.raw.priority.name)">
              {{ capitalizeFirstLetter(item.raw.priority.name) }}
            </v-chip>
          </template>

          <template v-slot:item.due_date="{ item }">
            <v-chip v-if="item.raw.due_date" :color="getDueDateColor(item.raw.due_date, item.raw.status.name)">
              <!-- {{ convertToDate(item.raw.due_date, "table") }} -->
              {{ item.raw.due_date }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <NuxtLink :to="'/workorders?id=' + item.raw.id" title="View and edit work order">
              <v-icon size="small" class="me-2">mdi-pencil</v-icon>
            </NuxtLink>
          </template>
        </v-data-table-server>
      </v-card>
    </v-layout>
  </v-container>
</template>

<script setup>
import { ref, nextTick, watch, toRaw } from 'vue'
import axios from 'axios'
import { useAuthStore } from '~/store/auth';
import { useNavMenuStore } from '~/store/navMenuStore'
import { capitalizeFirstLetter } from '~/helpers/capitalizeFirstLetter.js';

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const authStore = useAuthStore()
const navMenuStore = useNavMenuStore()
const itemsPerPage = ref(10)
const loading = ref(true)
const totalItems = ref(0)
const page = ref(1)
const lastPage = ref(false)
const data = ref([])
const search = ref('')
const searchString = ref('')
const statuses = ref([])

// use provide/inject pattern to receive data from layout
const dialog = inject('dialog')
const isRecordPage = inject('isRecordPage')
const filterByUser = inject('filterByUser')
const showCompleted = inject('showCompleted')

const props = defineProps({
  userInfo: Object,
})

// reload table when filterByUser data is changed
watch(filterByUser, (currentValue, newValue) => {
  if(currentValue !== newValue) {
    loadItems()
  }
})

// reload table when showCompleted data is changed
watch(showCompleted, (currentValue, newValue) => {
  if(currentValue !== newValue) {
    loadItems()
  }
})

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

// computed value for toggling group-by behavior
// if we still plan to incorporate grouping, then we will need to pass a :group-by="groupBy" prop in the <v-data-table-server> component
const groupBy = computed(() => {
  if(!filterByUser.value){
    return [{key: 'assignees'}]
  }
})

onBeforeMount(() => {
  setMenuItems(props.userInfo)
})

watch(() => route.query, () => 
  setMenuItems(props.userInfo)
)

// passing in userInfo in prep for ACL logic of menu itmes
function setMenuItems(userInfo) {
  let navigationItemsGroup = []
  let filterItemsGroup = []
  let addRecordItemsGroup = []

  if (isRecordPage.value) {
    navigationItemsGroup = [
      { 'label': 'Work Orders', 'destination': '/workorders', 'icon': 'mdi-keyboard-backspace' },
    ]
  } else {
    // example ACL logic
    // navigationItemsGroup = (userInfo.role = 'manager') ? [] : [
    //   { 'label': 'Projects', 'destination': '/projects', 'icon': 'mdi-form-select' },
    // ]

    navigationItemsGroup = [
      { 'label': 'Projects', 'destination': '/projects', 'icon': 'mdi-form-select' },
    ]
    filterItemsGroup = [
      { 'label': 'My Work Orders', 'icon': 'mdi-account-box', 'filter_name': 'filterByUser', 'filter_value': true },
      { 'label': 'All Work Orders', 'icon': 'mdi-account-box-multiple', 'filter_name': 'filterByUser', 'filter_value': false },
      { 'label': 'Not Completed', 'icon': 'mdi-format-list-bulleted', 'filter_name': 'showCompleted', 'filter_value': false },
      { 'label': 'Completed', 'icon': 'mdi-playlist-check', 'filter_name': 'showCompleted', 'filter_value': true },
    ]
    addRecordItemsGroup = [
      { 'label': 'Add New Work Order', 'icon': 'mdi-file-document-plus-outline' },
    ]
  }

  navMenuStore.setMenuItems(navigationItemsGroup, filterItemsGroup, addRecordItemsGroup)
}

// function loadItems({ page }) {
async function loadItems() {
  loading.value = true
  await loadStatuses()

  let axiosGetRequestURL = `${runtimeConfig.public.API_URL}/workorders?page=` + page.value + `&page_size=` + itemsPerPage.value

  if(search.value) axiosGetRequestURL = axiosGetRequestURL + `&search=` + search.value

  // set assignee filter - PENDING API IMPLEMENTATION
  // if(filterByUser.value) axiosGetRequestURL = axiosGetRequestURL + `&assignees[]=` + props.userInfo.id

  // set display completed work order filter
  if(showCompleted.value) {
    // get the ID of status = "complete"
    const completeStatusObj = statuses.value.filter(e => e.value == 'complete')
    const completeStatusID = completeStatusObj[0].id

    axiosGetRequestURL = axiosGetRequestURL + `&status[]=` + completeStatusID
  } else {
    const statusesArray = statuses.value.filter(e => e.value !== 'complete')

    let statusQueryStr = ''
    statusesArray.forEach(element => 
      statusQueryStr += '&status[]=' + toRaw(element).id
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
        description: item.description,
        due_date: item.due_date,
        id: item.id,
        links: item.links,
        name: item.name,
        priority: item.priority,

        // since this not in a pill, need to do this way
        // some projects/subtasks come in as NULL
        project: (item.project) ? item.project.name + ' | ' + item.subtask.name : '',
        
        status: item.status,
        // status_color: item.status.color,
        subtask: item.subtask,
        tags: item.tags,
        time_estimate: item.time_estimate,
        watchers: item.watchers
      }
    })
    lastPage.value = response.data.last_page
    totalItems.value = response.data.data.length
    loading.value = false
  })
  .catch(err => console.log(err))
}

async function loadStatuses() {
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
}

function close() {
  if(route.query.id) {
    navigateTo('/workorders')
  } else {
    dialog.value = false
  }
}

function closeAndReload() {
  dialog.value = false
  loadItems()
}

function submitSearch() {
  search.value = searchString.value
}

// priority color method for v-chip component
function getPriorityColor (priority) {
  switch(priority) {
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

function getDueDateColor(input, status) {
  // since input comes in as raw YYYY-MM-DD, we need to convert it back to MS in the user's timezone

  // get date object of input
  const rawDateTime = new Date(input)

  // get timezone offset (in minutes)
  const timeZoneOffset = rawDateTime.getTimezoneOffset()

  // convert timezone offset to milliseconds
  const timeZoneOffsetInMS = timeZoneOffset * 60000

  // Number(rawDateTime) will convert input's date object to milliseconds
  const convertedRawDateTime = (Number(rawDateTime) + Number(timeZoneOffsetInMS))
  
  const date = new Date(convertedRawDateTime)

  // today's date in user's current timezone
  const todayInMS = new Date() 

  // today's date in user's current timezone plus 5 days
  const todayPlusFiveDays = Number(todayInMS) + 432000000

  // if task is not complete, then set color
  // red for overdue (or due today), yellow for due within 5 days
  let color = ""
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