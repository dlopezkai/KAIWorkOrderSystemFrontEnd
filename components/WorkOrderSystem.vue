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
      <v-list-item prepend-icon="mdi-account-box" title="My work orders" @click="filterByUserToggle('user')"></v-list-item>
      <v-list-item prepend-icon="mdi-account-box-multiple" title=" All work orders" @click="filterByUserToggle('all')"></v-list-item>
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
      @click:row="(pointerEvent, {item}) => editItem(item.raw)"
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

            <v-overlay v-model="submitStatusOverlay" class="align-center justify-center" persistent>
              <v-container style="height: 400px;">
                <v-row class="fill-height" align-content="center" justify="center">
                  <v-col class="text-subtitle-1 text-center" cols="12">
                    <v-card>
                      <v-card-title>{{ onSubmitMsg }}</v-card-title>
                      <v-card-text v-if="submitErrorInfo">{{ submitErrorInfo }}</v-card-text>
                      <v-progress-circular v-if="submitStatus === 'submitting'" color="#92D5D5" indeterminate size="64" class="mb-4"></v-progress-circular>
                      <v-btn v-if="submitStatus != 'submitting'" color="blue-darken-1" variant="text" class="mb-4" @click="resetSubmitStatus()">
                          OK
                      </v-btn>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </v-overlay>

            <v-card>
              <v-card-title>
                <span class="text-h5">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                
              <v-tabs v-if="editedIndex > -1" v-model="formTab" color="#428086">
                <v-tab value="one">Details</v-tab>
                <v-tab value="two">Comments</v-tab>
              </v-tabs>

              <v-window v-model="formTab">

                <v-window-item value="one">
                  <v-form ref="form" @submit.prevent="submit">
                    <v-row>
                      <v-col cols="12" sm="12" md="12">
                        <v-text-field v-model="editedItem.name" label="Name" 
                          :rules="[rules.required]"></v-text-field>
                      </v-col>

                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.folder" label="Project" :items="folders" item-title="name" item-value="id" @update:modelValue="loadLists()" :rules="[rules.select]"></v-select>
                      </v-col>
                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.list" label="Subtask" :items="lists" item-title="name" item-value="id" :rules="[rules.select]"></v-select>
                      </v-col>

                      <v-col cols="12" sm="12" md="12">
                        <v-select v-model="editedItem.tags" label="Type" :items="tags" item-title="title" item-value="value" multiple chips clearable></v-select>
                      </v-col>

                      <v-col v-if="editedIndex > -1" cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.status" label="Status" :items="statuses" item-title="title" item-value="value"></v-select>
                      </v-col>
                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.assignees" label="Assignee(s)" :items="members" item-title="title" item-value="value" multiple chips clearable></v-select>
                      </v-col>

                      <v-col cols="12" sm="6" md="6">
                        <v-text-field v-model="editedItem.due_date" label="Due Date" type="date" :rules="[rules.due_date, rules.due_date_threshold]"></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.watchers" label="Notify Person" :items="members" item-title="title" item-value="value" multiple chips clearable></v-select>
                      </v-col>

                      <v-col cols="12" sm="6" md="6">
                        <v-text-field v-model="editedItem.time_estimate" label="Budgeted Hours"></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.priority" label="Priority" :items="priorities" item-title="title" item-value="value" :hint="priorityMessages" persistent-hint></v-select>
                      </v-col>

                      <v-col cols="12" sm="12" md="12">
                        <QuillEditor
                          v-model:content="editedItem.description" 
                          contentType="html" 
                          theme="snow" 
                          placeholder="Description"
                          toolbar="essential" 
                          style="height:200px; max-height:250px;"
                        ></QuillEditor>
                      </v-col>

                      <v-col cols="12" sm="12" md="12" class="mt-5">
                        <v-text-field v-model="editedItem.links" label="SharePoint File"></v-text-field>
                        <v-btn href="https://kauffmaninc.sharepoint.com/" target="_blank" variant="tonal" class="rounded" color="#428086">Open SharePoint site</v-btn>
                      </v-col>

                      <!-- hide for production -->
                      <v-col v-if="editedItem.url" cols="12" sm="12" md="12">
                        <v-btn :href="editedItem.url" target="_blank" variant="text">ClickUp reference link</v-btn>
                      </v-col>

                      <v-col class="text-right">
                        <v-btn variant="plain" @click="close">Cancel</v-btn>
                        <v-btn :disabled="submitBtnDisabled" class="rounded" color="blue" @click="submit">{{ submitBtnText }}</v-btn>
                      </v-col>
                    </v-row>
                  </v-form>
                </v-window-item>

                <v-window-item v-if="editedIndex > -1" value="two">
                  <!-- <comments-comp taskid=866a8z405 :clickUpUserInfo="clickUpUserInfo"></comments-comp> -->
                  <comments-comp :taskid="editedItem.id" :clickUpUserInfo="clickUpUserInfo"></comments-comp>
                </v-window-item>

              </v-window>

              </v-card-text>
            </v-card>
          </v-dialog>
        <!-- </v-toolbar> -->
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
        <!-- <v-icon size="small" class="me-2" @click="editItem(item.raw)">
          mdi-pencil
        </v-icon> -->
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
import CommentsComp from './CommentsComp.vue';
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
const editedIndex = ref(-1)
const data = ref([])
const search = ref('')
const filterByUser = ref(true)
const showCompleted = ref(false)
const drawer = ref(false)
const form = ref(null)
const tags = ref([])
const members = ref([])
const folders = ref([])
const lists = ref([])
const formTab = ref(null)
const clickUpUserInfo = ref()
const submitBtnDisabled = ref(false)
const submitStatusOverlay = ref(false)
const submitStatus = ref('')
const submitErrorInfo = ref('')
const statuses = ref([])
const priorities = ref([])

const headers = [
  { title: 'Name', key: 'name', align: 'start', width: '25%' },
  { title: 'Project', key: 'project', align: 'start', sortable: false },
  { title: 'Assignee(s)', key: 'assignees', align: 'start', sortable: false },
  { title: 'Type', key: 'tags', align: 'start', sortable: false },
  { title: 'Status', key: 'status', align: 'start', sortable: false },
  { title: 'Priority', key: 'priority', align: 'start', sortable: false },
  { title: 'Due Date', key: 'due_date', align: 'start', sortable: false },
  // { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const editedItem = ref([
  {
    assignees: '',
    creator: '',
    description: '',
    due_date: '',
    folder: '',
    id: '',
    links: '',
    list: '',
    name: '',
    priority: '',
    project: '',
    status: '',
    tags: '',
    time_estimate: '',
    watchers: ''
  },
])

const defaultItem = ref([
  {
    assignees: '',
    creator: '',
    description: '',
    due_date: '',
    folder: '',
    id: '',
    links: '',
    list: '',
    name: '',
    priority: '',
    project: '',
    status: '',
    tags: '',
    time_estimate: '',
    watchers: '',
  },
])

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

// computed value for form title
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'New Work Order Form' : 'Edit Work Order Form'
})

// computed value for save/submit button text
const submitBtnText = computed(() => {
  return editedIndex.value === -1 ? 'Submit' : 'Save'
})

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

// computed value for priority SLA messages
const priorityMessages = computed(() => {
  switch(editedItem.value.priority) {
    case 1:
      return 'SLA: 4 Business hours'
    case 2:
      return 'SLA: 1 Business Days for contact'
    case 3:
      return 'SLA: 3 Business Days for contact'
    case 4:
      return 'SLA: 5 Business Days for contact'
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

// resets the form tab when dialog is reopened
watch(dialog, (currentValue, newValue) => {
  formTab.value = (currentValue) ? "one" : "two"
})

// checks for the 2 business days rule
function dateValidation(input) {

  // get day of week
  let selectedDateDay = new Date(input).getDay()

  // get the current date plus 2 days, the convert to ISO format
  let date = new Date();
  let twoDaysFromNow = date.setDate(date.getDate() + 2);
  twoDaysFromNow = new Date(twoDaysFromNow).toISOString();

  // convert to local time
  let twoDaysFromNowLocaleString = new Date(twoDaysFromNow).toLocaleDateString()
  let twoDaysFromNowDateObj = new Date(twoDaysFromNowLocaleString)

  // convert to yyyy-mm-dd to match format of calendar input
  let twoDaysFromNowFormatted = convertToYyyymmddFormat(twoDaysFromNowDateObj)

  // logic to determine if selected date is valid
  if(selectedDateDay !== 5 && selectedDateDay !== 6) {
    if(input >= twoDaysFromNowFormatted) {
      return true
    } else {
      return false
    }
  }

}

// form submit process
async function submit() {
  const { valid } = await form.value.validate()
  if (valid) {
    save()
  }
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
  loadTags()
  loadMembers()
  loadFolders()
  loadStatuses()
  loadPriorities()
})

// function loadItems({ page }) {
function loadItems() {
  loading.value = true
  let axiosGetRequestURL = `${runtimeConfig.public.API_URL}/tasks/?page=` + page.value

  // set filters
  if(filterByUser.value) axiosGetRequestURL = axiosGetRequestURL + `&assignees[]=` + clickUpUserInfo.value.id

  // TODO: construct an array of all available statuses except complete
  // if(showCompleted.value) axiosGetRequestURL = axiosGetRequestURL + `&statuses[]=complete`

  axios.get(axiosGetRequestURL)
  .then((response) => {
    // data.value = response.data.data.slice(0, 10).map((item) => {
    data.value = response.data.data.map((item) => {
      return {
        assignees: item.assignees,
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

function loadTags() {
  axios.get(`${runtimeConfig.public.API_URL}/tags`)
  .then((response) => {
    tags.value = response.data.data.map((item) => {
      return {
        title: item.name,
        value: item.name
      }
    })

    // sort tags list
    tags.value = tags.value.sort((a, b) => 
      a.title.localeCompare(b.title))
  })
  .catch(err => console.log(err))
}

function loadMembers() {
  axios.get(`${runtimeConfig.public.API_URL}/members`)
  .then((response) => {
    members.value = response.data.data.map((item) => {
      return {
        title: (!item.username) ? item.email : item.username,
        value: {color: item.color, email: item.email, id: item.id, initials: item.initials, profile: item.profile, username: item.username}
      }
    })

    // sort members list
    members.value = members.value.sort((a, b) => 
      a.title.localeCompare(b.title))
  })
  .catch(err => console.log(err))
}

function loadFolders() {
  // load folder options
  axios.get(`${runtimeConfig.public.API_URL}/folders`)
  .then((response) => {
    folders.value = response.data.data.map((item) => {
      return {
        id: item.id,
        name: item.name
      }
    })
  })
  .catch(err => console.log(err))
}

function loadLists(presentFolderId) {
  // clear list/subtask
  editedItem.value.list = ''

  // clear list/subtask options
  lists.value = ''

  // get selected folder ID
  let folderId = (presentFolderId) ? presentFolderId : editedItem.value.folder

  // load list/subtask options
  axios.get(`${runtimeConfig.public.API_URL}/folder/` + folderId + `/lists`)
  .then((response) => {
    lists.value = response.data.data.map((item) => {
      return {
        id: item.id,
        name: item.name
      }
    })
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

function loadPriorities() {
  axios.get(`${runtimeConfig.public.API_URL}/priorities`)
  .then((response) => {
    priorities.value = response.data.data.map((item) => {
      return {
        title: capitalizeFirstLetter(item.name),
        value: item.id,
      }
    })
  })
  .catch(err => console.log(err))
}

function editItem(item) {
  editedIndex.value = data.value.indexOf(item)

  // convert time estimate (milliseconds) to hours if not a new work order
  if (editedIndex.value > -1) {
    loadFolders()
    loadLists(item.folder)
    editedItem.value = Object.assign({}, item)
    editedItem.value.priority = (item.priority != null) ? capitalizeFirstLetter(item.priority.priority) : null
    editedItem.value.due_date = convertToDate(item.due_date, "table")
    editedItem.value.time_estimate = millisecondsToHours(item.time_estimate)

    // get list of watchers and assign it to the editedItem object
    axios.get(`${runtimeConfig.public.API_URL}/task/` + item.id)
    .then((response) => {
      editedItem.value.watchers = response.data.data.watchers
    })
    .catch(err => console.log(err))
  } else {
    editedItem.value = Object.assign({}, item)
  }

  dialog.value = true
}

function close() {
  dialog.value = false
  nextTick(() => {
    editedItem.value = Object.assign({}, defaultItem.value)
    editedIndex.value = -1
  })
}

function resetSubmitStatus() {
  if(submitStatus.value === 'submitting') {
    close()
  }

  if(submitStatus.value === 'success') {
    close()
    loadItems()
  }

  submitStatus.value = ''
  submitStatusOverlay.value = false
  submitBtnDisabled.value = false
}

function save() {
  submitErrorInfo.value = ''
  submitStatus.value = 'submitting'
  submitStatusOverlay.value = true
  submitBtnDisabled.value = true

  // create a data object that will be passed to API to prevent user from seeing conversions
  let data = Object.assign({}, editedItem.value)

  // since API needs IDs of assignees, pull the assignee(s) ID(s) and store in temp array
  let assigneeids = []

  if(data.assignees) {
    data.assignees.forEach(element => {
      assigneeids.push(element.id)
    })
    data.assignees = assigneeids
  }

  // since API needs IDs of watchers, pull the watcher(s) ID(s) and store in temp array
  // let watcherids = []

  // if(data.watchers) {
  //   data.watchers.forEach(element => {
  //     watcherids.push(element.id)
  //   })
  //   data.watchers = watcherids
  // }

  // convert time estimate (hours) to milliseconds
  if(data.time_estimate) data.time_estimate = hoursToMilliseconds(data.time_estimate)

  // FOR TEST PURPOSES ONLY!! - REMOVE ME LATER
  data.list = 901001092394

  if (editedIndex.value === -1) {
    data.creator = clickUpUserInfo.value.id

    axios.post(`${runtimeConfig.public.API_URL}/list/` + data.list + `/task`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(function (response) {
      if (response.status === 200) {
        if (response.data.response_code === 200) {
          submitStatus.value = 'success'
        } else {
          submitStatus.value = 'internal_api_error'
          submitErrorInfo.value = data
          console.log(response)
          return
        }
      }
    })
    .catch(function (error) {
      submitStatus.value = 'connection_failure'
      submitErrorInfo.value = error
      console.log(error)
    })

  } else {
    // perform PUT request here
  }

}

function filterByUserToggle (type) {
  if(type === 'user') {
    filterByUser.value = true
  } else {
    filterByUser.value = false
  } 

  loadItems()
}

function toggleShowCompleted (value) {
  if(value != showCompleted.value) {
    showCompleted.value = (value) ? true : false
    // loadItems()
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

function millisecondsToHours(value) {
  if(value) {
    const hours = (value / 1000 / 60 / 60).toFixed(2)

    return hours
  }
}

function convertToYyyymmddFormat(value) {
  return value.getFullYear() 
    + "-" 
    + ((value.getMonth()+1).length != 2 ? "0" + (value.getMonth() + 1) : (value.getMonth()+1)) 
    + "-" 
    + (value.getDate().length != 2 ? "0" + value.getDate() : value.getDate());
}

</script>

<style scoped>

</style>