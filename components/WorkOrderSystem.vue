<template>
  <v-container fluid full-height>
    <v-layout child-flex>
      <v-card v-if="route.query.id" width="100vw">
        <form-component-work-order form-action="edit" :statuses="props.statuses" :record-id="route.query.id" @close="close()" @closeAndReload="closeAndReload()"></form-component-work-order>
      </v-card>
      <v-card v-else width="100vw">
        <div class="d-flex mb-2">
          <v-autocomplete v-model="selectedAssignee" hide-details=true label="Filter by Assignee" :items="props.persons" class="pr-10"></v-autocomplete>
          <v-text-field
            v-model="searchString"
            prepend-icon="mdi-magnify"
            label="Search work orders"
            single-line
            class="pr-5"
            hide-details
            @keydown.enter="submitSearch()"
            @keyup="checkIfSearchFieldIsEmpty()"
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
              <form-component-work-order form-action="new" :statuses="props.statuses" @close="close()" @closeAndReload="closeAndReload()"></form-component-work-order>
            </v-dialog>
          </template>

          <template v-slot:item.project="{ item }">
            {{ item.raw.project.name + ' (' + item.raw.project.billing_code + ') | ' + item.raw.subtask.name  }}
          </template>

          <template v-slot:item.creator="{ item }">
            {{ item.raw.creator.name }}
          </template>

          <template v-slot:item.assignees="{ item }">
            <v-chip v-for="assignee in item.raw.assignees">{{ assignee.name }}</v-chip>
          </template>

          <template v-slot:item.tags="{ item }">
            <v-chip v-for="tag in item.raw.tags">{{ tag.name.toUpperCase() }}</v-chip>
          </template>

          <template v-slot:item.status="{ item }">
            <!-- need v-if since some statuses come in as NULL -->
            <v-chip v-if="item.raw.status" :color="item.raw.status.color" variant="outlined">
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
              {{ formatToMMDDYYYY(item.raw.due_date) }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <NuxtLink v-if="item.raw.project.isarchived == 1" :to="'/workorders?id=' + item.raw.id" title="View work order">
              <v-icon size="small" class="me-2">mdi-list-box-outline</v-icon>
            </NuxtLink>
            <NuxtLink v-else :to="'/workorders?id=' + item.raw.id" title="View and edit work order">
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
import { useUserInfoStore } from '~/store/userInfoStore'
import { capitalizeFirstLetter } from '~/helpers/capitalizeFirstLetter.js';
import { formatToMMDDYYYY } from '~/helpers/datetimeConversions.js';

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const authStore = useAuthStore()
const navMenuStore = useNavMenuStore()
const userInfoStore = useUserInfoStore()
const itemsPerPage = ref(10)
const loading = ref(true)
const totalItems = ref(0)
const page = ref(1)
const data = ref([])
const search = ref('')
const searchString = ref('')
const selectedAssignee = ref(userInfoStore.userInfo.id)

// use provide/inject pattern to receive data from layout
const dialog = inject('dialog')
const isRecordPage = inject('isRecordPage')
const filterByUserTrigger = inject('filterByUserTrigger')
const showNonCompletedTrigger = inject('showNonCompletedTrigger')
const showCompletedTrigger = inject('showCompletedTrigger')

const showCompleted = ref(false)

const props = defineProps({
  statuses: Array,
  persons: Array,
})

const headers = [
  { title: 'Name', key: 'name', align: 'start', sortable: false, width: '25%' },
  { title: 'Project', key: 'project', align: 'start', sortable: false },
  { title: 'Created By', key: 'creator', align: 'start', sortable: false },
  { title: 'Assignee(s)', key: 'assignees', align: 'start', sortable: false },
  { title: 'Type', key: 'tags', align: 'start', sortable: true },
  { title: 'Status', key: 'status', align: 'center', sortable: true },
  { title: 'Priority', key: 'priority', align: 'center', sortable: true },
  { title: 'Due Date', key: 'due_date', align: 'center', sortable: true },
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


onBeforeMount(() => {
  setMenuItems()
})

watch(() => route.query, () => 
  setMenuItems()
)

// set the selectedAssignee back to logged-in user
// set the showCompleted flag to false
watch(filterByUserTrigger, (currentValue, newValue) => {
  if(currentValue !== newValue) {
    showCompleted.value = false
    selectedAssignee.value = userInfoStore.userInfo.id
  }
})

// sets the show complete filter to false, and sets the selected user to '0' if not already set to '0'
watch(showNonCompletedTrigger, (currentValue, newValue) => {
  if(currentValue !== newValue) {
    if(showCompleted.value === true || selectedAssignee.value != '0') {
      showCompleted.value = false
      if(selectedAssignee.value != '0') {
        selectedAssignee.value = '0' // this will trip the selectedAssignee watcher, and thus, perform loadItems() method again
      } else {
        loadItems()
      }
    }
  }
})

// sets the show complete filter to true, and sets the selected user to '0' if not already set to '0'
// if selectedAssignee is set to '0' here, it will trigger the selectedAssignee to reload the table
watch(showCompletedTrigger, (currentValue, newValue) => {
  if(currentValue !== newValue) {
    if(showCompleted.value === false || selectedAssignee.value != '0') {
      showCompleted.value = true
      if(selectedAssignee.value != '0') {
        selectedAssignee.value = '0' // this will trip the selectedAssignee watcher, and thus, perform loadItems() method again
      } else {
        loadItems()
      }
    }
  }
})

// reload table when selectedAssignee data is changed
watch(selectedAssignee, (currentValue, newValue) => {
  if(currentValue !== newValue) {
    loadItems()
  }
})


function setMenuItems() {
  let navigationItems = []
  let filterItems = []
  let settingsItems = []

  if (isRecordPage.value) {
    navigationItems = [
      { 'label': 'Work Orders', 'destination': '/workorders', 'icon': 'mdi-keyboard-backspace' },
    ]
  } else {
    // only show settings menu if current user has the admin role
    settingsItems = (userInfoStore.userInfo.role === 'admin') ? [
      { 'label': 'Projects', 'destination': '/projects', 'icon': 'mdi-form-select' },
      { 'label': 'Users', 'destination': '/users', 'icon': 'mdi-account-multiple' },
    ] : []
    filterItems = [
      { 'label': 'My Work Orders', 'icon': 'mdi-account-box', 'filter_name': 'filterByUser', 'default_class': 'active' },
      { 'label': 'All Work Orders', 'icon': 'mdi-format-list-bulleted', 'filter_name': 'showNonCompleted', 'default_active': '' },
      { 'label': 'Completed', 'icon': 'mdi-playlist-check', 'filter_name': 'showCompleted', 'default_active': '' },
    ]
  }

  navMenuStore.setTableName('Work Orders')
  navMenuStore.setMenuItems(navigationItems, settingsItems, filterItems)
  navMenuStore.setCanAddNewRecord(true)
}


function loadItems({ sortBy }) {
  loading.value = true

  let axiosGetRequestURL = `${runtimeConfig.public.API_URL}/workorders?page=` + page.value + `&page_size=` + itemsPerPage.value

  if(search.value) axiosGetRequestURL = axiosGetRequestURL + `&search=` + search.value

  // filter by user if a valid user is selected
  if(selectedAssignee.value !== '0') axiosGetRequestURL = axiosGetRequestURL + `&assignees[]=` + selectedAssignee.value

  // set display completed work order filter
  if(showCompleted.value) {
    // get the ID of status = "complete"
    const completeStatusObj = props.statuses.filter(e => e.value == 'complete')
    const completeStatusID = completeStatusObj[0].id

    axiosGetRequestURL = axiosGetRequestURL + `&status[]=` + completeStatusID
  } else {
    const statusesArray = props.statuses.filter(e => e.value !== 'complete')

    let statusQueryStr = ''
    statusesArray.forEach(element => 
      statusQueryStr += '&status[]=' + toRaw(element).id
    )

    axiosGetRequestURL = axiosGetRequestURL + statusQueryStr
  }

  // set sorting params here
  if(sortBy[0]) {
    let sortingQueryStr = ''
    sortingQueryStr = (sortBy[0].order === 'desc') ? `&orderby=` + sortBy[0].key + `&reverse=true` : `&orderby=` + sortBy[0].key

    axiosGetRequestURL = axiosGetRequestURL + sortingQueryStr
  }

  axios.get(axiosGetRequestURL)
  .then((response) => {
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
        project: item.project,
        status: item.status,
        subtask: item.subtask,
        tags: item.tags,
        time_estimate: item.time_estimate,
        watchers: item.watchers
      }
    })
    totalItems.value = response.data.total
    loading.value = false
  })
  .catch(err => console.log(err))
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


function checkIfSearchFieldIsEmpty() {
  if(searchString.value.length === 0) {
    submitSearch()
  }
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