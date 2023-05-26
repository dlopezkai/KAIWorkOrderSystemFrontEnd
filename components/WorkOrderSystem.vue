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
      <v-list-item prepend-icon="mdi-form-select" title="Add New Work Order" @click="editItem(item)"></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar app clipped-left dark color="#92D5D5">
    <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    <v-toolbar-title>Work Order System</v-toolbar-title>
    <AuthN></AuthN>
  </v-app-bar>

  <!-- <div v-if="!clickUpUserInfo.length">
    <p>Please register for a KAI ClickUp account to use this application</p>
  </div> -->
  <!-- <div v-else>  -->
    <v-data-table
      :headers="headers" 
      :items="filteredData" 
      :loading="loading" 
      class="elevation-1"
      density="comfortable"
      :search="search"
      @click:row="(pointerEvent, {item}) => editItem(item.raw)"
    >
    <!-- <v-data-table
      :headers="headers" 
      :items="filteredData" 
      :group-by="groupBy"
      :loading="loading" 
      class="elevation-1"
      :search="search"
      @click:row="(pointerEvent, {item}) => editItem(item.raw)"
    > -->
      <template v-slot:top>

        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          density="comfortable"
          hide-details
        ></v-text-field>

        <!-- <v-toolbar flat> -->

          <v-dialog v-model="dialog" max-width="800px">
            <!-- <template v-slot:activator="{ props }">
              <v-col class="text-center">
                <v-btn color="primary" dark class="mb-2" v-bind="props">
                  Add New Work Order
                </v-btn>
              </v-col>
            </template> -->
            <v-card>
              <v-card-title>
                <span class="text-h5">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                
              <v-tabs v-if="editedIndex > -1" v-model="tab" color="#428086">
                <v-tab value="one">Details</v-tab>
                <v-tab value="two">Comments</v-tab>
              </v-tabs>

              <v-window v-model="tab">

                <v-window-item value="one">
                  <v-form ref="form" @submit.prevent="submit">
                    <v-row>
                      <v-col cols="12" sm="12" md="12">
                        <v-text-field v-model="editedItem.name" label="Name" 
                          :rules="[rules.required]"></v-text-field>
                      </v-col>

                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.folder" label="Project" :items="folders" item-title="name" item-value="id" @update:modelValue="loadContracts()"
                          :rules="[rules.select]" ></v-select>
                      </v-col>
                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.contract" label="Subtask" :items="contracts" item-title="name" item-value="id"
                          :rules="[rules.select]"></v-select>
                      </v-col>

                      <v-col cols="12" sm="12" md="12">
                        <v-select v-model="editedItem.tags" label="Type" :items="tags" item-title="title" item-value="value" multiple chips clearable></v-select>
                      </v-col>

                      <v-col v-if="editedIndex > -1" cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.status" label="Status" items="" item-title="title"
                          item-value="value" disabled></v-select>
                      </v-col>
                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.assigned_to" label="Assignee(s)" :items="members" item-title="title" item-value="value" multiple chips clearable></v-select>
                      </v-col>

                      <v-col cols="12" sm="6" md="6">
                        <v-text-field v-model="editedItem.due_date" label="Due Date" type="datetime-local"
                          :rules="[rules.due_date, rules.due_date_threshold]"></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.notify_person" label="Notify Person" :items="members" item-title="title" item-value="value" multiple chips clearable></v-select>
                      </v-col>

                      <v-col cols="12" sm="6" md="6">
                        <v-text-field v-model="editedItem.estimate" label="Hours Allocated"></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6" md="6">
                        <v-select v-model="editedItem.priority" label="Priority" :items="priorities" item-title="priority" item-value="id"></v-select>
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
                      </v-col>

                      <!-- hide for production -->
                      <v-col v-if="editedItem.url" cols="12" sm="12" md="12">
                        <v-btn :href="editedItem.url" target="_blank" variant="text">ClickUp reference link</v-btn>
                      </v-col>

                      <v-col class="text-right">
                        <v-btn color="blue-darken-1" variant="text" @click="close">
                          Cancel
                        </v-btn>
                        <v-btn color="blue-darken-1" variant="text" @click="submit">
                          Submit
                        </v-btn>
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

      <template v-slot:item.assigned_to="{ item }">
        <v-chip v-for="assignee in item.raw.assigned_to">{{ (!assignee.username) ? assignee.email : assignee.username }}</v-chip>
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
          {{ (!item.raw.priority) 
                ? null 
                : (item.raw.priority === null) 
                ? null 
                : capitalizeFirstLetter(item.raw.priority.priority)
          }}
        </v-chip>
      </template>

      <template v-slot:item.due_date="{ item }">
        <v-chip :color="getDueDateColor(item.raw.due_date, item.raw.status)">{{ convertToDate(item.raw.due_date, "table") }}</v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <!-- <v-icon size="small" class="me-2" @click="editItem(item.raw)">
          mdi-pencil
        </v-icon> -->
      </template>

    </v-data-table>
  <!-- </div> -->
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '~/store/auth';
import CommentsComp from './CommentsComp.vue';
import { convertToDate } from '~/helpers/convertToDate.js';
import { capitalizeFirstLetter } from '~/helpers/capitalizeFirstLetter.js';

const runtimeConfig = useRuntimeConfig()
    
const authStore = useAuthStore()
const dialog = ref(false)
// const dialogDelete = ref(false)
const itemsPerPage = ref(10)
const loading = ref(true)
const totalItems = ref(0)
const editedIndex = ref(-1)
const data = ref([])
const search = ref('')
const filterByUser = ref(true)
const drawer = ref(false)
const form = ref(null)
const tags = ref([])
const members = ref([])

const folders = ref([])
const contracts = ref([])

const tab = ref(null)

const clickUpUserInfo = ref()

const headers = [
  { title: 'Name', key: 'name', align: 'start', width: '25%' },
  { title: 'Project', key: 'project', align: 'start', sortable: false },
  { title: 'Assignee(s)', key: 'assigned_to', align: 'start', sortable: false },
  { title: 'Type', key: 'tags', align: 'start', sortable: false },
  { title: 'Status', key: 'status', align: 'start', sortable: false },
  { title: 'Priority', key: 'priority', align: 'start', sortable: false },
  { title: 'Due Date', key: 'due_date', align: 'start', sortable: false },
  // { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const editedItem = ref([
  {
    assigned_to: '',
    contract: '',
    description: '',
    due_date: '',
    estimate: '',
    folder: '',
    id: '',
    links: '',
    name: '',
    notify_person: '',
    priority: '',
    project: '',
    status: '',
    tags: ''
  },
])

const defaultItem = ref([
  {
    assigned_to: '',
    contract: '',
    description: '',
    due_date: '',
    estimate: '',
    folder: '',
    id: '',
    links: '',
    name: '',
    notify_person: '',
    priority: '',
    project: '',
    status: '',
    tags: ''
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

// check if API will provide these
// if API provides integer-based values, we will need to map v-data-table to render properly
const priorities = [
  { priority: 'Low', id: 4, color: '#d8d8d8' },
  { priority: 'Normal', id: 3, color: '#6fddff' },
  { priority: 'High', id: 2, color: '#ffcc00' },
  { priority: 'Urgent', id: 1, color: '#f50000' },
]

// computed value for form title
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'New Work Order Form' : 'Edit Work Order Form'
})

// computed value for filtering data by logged-in user 
// checks work order's assignee's email address against logged-in user's AD email
const filteredData = computed(() => {
  if(filterByUser.value){
    let output = data.value.filter(item => {
      if(item.assigned_to) {
        let opt = item.assigned_to.some((
          { email }) => email == authStore.currentUser.username)
        return opt
      }
    })
    return output
  }
  return data.value
})

// computed value for toggling group-by behavior
const groupBy = computed(() => {
  if(!filterByUser.value){
    return [{key: 'assigned_to'}]
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

// resets the tab when dialog is reopened
watch(dialog, (currentValue, newValue) => {
  tab.value = (currentValue) ? "one" : "two"
})

// checks for the 2 business days rule
function dateValidation(input) {

  // convert input to milliseconds
  let selectedDate = new Date(input).getTime()

  // get day of week
  let selectedDateDay = new Date(input).getDay()

  // get the current date plus 2 days
  let todaysDate = new Date().setHours(0,0,0,0);
  let todaysDatePlusTwoDays = todaysDate + 172800000

  // logic to determine if selected date is valid
  if(selectedDateDay !== 0 && selectedDateDay !== 6) {
    if(selectedDate >= todaysDatePlusTwoDays) {
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
  axios.get(`${runtimeConfig.public.API_URL}/members/?email=` + authStore.currentUser.username)
  .then((response) => {
    clickUpUserInfo.value = response.data.data[0]
  })
  .catch(err => console.log(err))
}


// mounted life-cycle hook
onMounted(() => {
  loadItems()
  loadTags()
  loadMembers()
  loadFolders()
})

function loadItems() {
  loading.value = true
  axios.get(`${runtimeConfig.public.API_URL}/tasks`)
  .then((response) => {
    data.value = response.data.data.map((item) => {
      return {
        assigned_to: item.assignees,
        contract: item.list.id,
        description: item.text_content,
        due_date: item.due_date,
        estimate: item.time_estimate,
        folder: item.folder.id,
        id: item.id,
        links: item.links,
        name: item.name,
        notify_person: item.notify_person,
        priority: item.priority,
        project: item.folder.name + ' | ' + item.list.name,
        status: item.status.status,
        status_color: item.status.color,
        tags: item.tags,
        url: item.url
      }
    })
    totalItems.value = response.data.data.length
    loading.value = false
  })
  .catch(err => console.log(err))
}

function loadTags() {
  loading.value = true
  axios.get(`${runtimeConfig.public.API_URL}/tags`)
  .then((response) => {
    tags.value = response.data.data.map((item) => {
      return {
        title: item.name,
        value: item.name
      }
    })
    loading.value = false
  })
  .catch(err => console.log(err))
}

function loadMembers() {
  loading.value = true
  axios.get(`${runtimeConfig.public.API_URL}/members`)
  .then((response) => {
    members.value = response.data.data.map((item) => {
      return {
        title: (!item.username) ? item.email : item.username,
        value: {color: item.color, email: item.email, id: item.id, initials: item.initials, profile: item.profile, username: item.username}
      }
    })
    loading.value = false
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

function loadContracts(presentFolderId) {
  // clear contract
  editedItem.value.contract = ''

  // clear contract options
  contracts.value = ''

  // get selected folder ID
  let folderId = (presentFolderId) ? presentFolderId : editedItem.value.folder

  // load list/contract options
  axios.get(`${runtimeConfig.public.API_URL}/folder/` + folderId + `/lists`)
  .then((response) => {
    contracts.value = response.data.data.map((item) => {
      return {
        id: item.id,
        name: item.name
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
    loadContracts(item.folder)
    editedItem.value = Object.assign({}, item)
    editedItem.value.status = capitalizeFirstLetter(item.status)
    editedItem.value.priority = (item.priority != null) ? capitalizeFirstLetter(item.priority.priority) : null
    editedItem.value.due_date = convertToDate(item.due_date, "form")
    editedItem.value.estimate = millisecondsToHours(item.estimate)
  } else {
    // editedItem.value = Object.assign({status: "Int Request"}, item)
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

function save() {
  // convert time estimate (hours) to milliseconds
  editedItem.value.estimate = hoursToMilliseconds(editedItem.value.estimate)

  // convert due date to milliseconds
  editedItem.value.due_date = dateToMilliseconds(editedItem.value.due_date)

  if (editedIndex.value > -1) {
    axios.post('test2.json', JSON.stringify(editedItem.value, null, 2))
    Object.assign(data.value[editedIndex.value], editedItem.value)
  } else {
    axios.post('test2.json', JSON.stringify(editedItem.value, null, 2))
    data.value.push(editedItem.value)
  }
  close()
}

// function deleteItem(item) {
//     editedIndex.value = data.value.indexOf(item)
//     editedItem.value = Object.assign({}, item)
//     dialogDelete.value = true
// }

// function deleteItemConfirm() {
//     data.value.value.splice(editedIndex.value, 1)
//     closeDelete()
// }

// function closeDelete() {
//     dialogDelete.value = false
//     nextTick(() => {
//         editedItem.value = Object.assign({}, defaultItem.value)
//         editedIndex.value = -1
//     })
// }

function filterByUserToggle (type) {
  if(type === 'user') {
    filterByUser.value = true
  } else {
    filterByUser.value = false
  } 
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
  // red for overdue, or due today
  // yellow for due within 5 days
  if(status != "complete") {
    if (todayInMS >= date) {
      color = "#f50000"
    } else if (todayPlusFiveDays > date) {
      color = "#ffcc00"
    }
  }

  return color
}

function dateToMilliseconds(value) {
  const milliseconds = new Date(value).getTime()

  return milliseconds
}

function millisecondsToHours(value) {
  if(value) {
    const hours = (value / 1000 / 60 / 60).toFixed(2)

    return hours
  }
}

function hoursToMilliseconds(value) {
  if(value) {
    const milliseconds = value * 60 * 60 * 1000

    return milliseconds
  }
}

</script>

<style scoped>

</style>