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

  <v-app-bar app clipped-left dark>
    <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    <v-toolbar-title>ClickUp Integration App</v-toolbar-title>
    <AuthN></AuthN>
  </v-app-bar>

  <v-data-table
    :headers="headers" 
    :items="filteredData" 
    :loading="loading" 
    class="elevation-1"
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
              <v-form ref="form" @submit.prevent="submit">
                <v-row>
                  <v-col cols="12" sm="12" md="12">
                    <v-text-field v-model="editedItem.name" label="Name"></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.contract" label="Contract" :items="contracts" item-title="title" item-value="value"
                      :rules="[rules.select]"></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.tags" label="Type" :items="tags" item-title="name" item-value="name" multiple chips clearable
                      :rules="[rules.select]"></v-select>
                  </v-col>

                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.status" label="Status" :items="statuses" item-title="title"
                      item-value="value" readonly :rules="[rules.select]"></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.assigned_to" label="Assignee(s)" :items="members" item-title="username" item-value="id" multiple chips clearable
                      :rules="[rules.select]"></v-select>
                  </v-col>

                  <v-col cols="12" sm="6" md="6">
                    <v-text-field v-model="editedItem.due_date" label="Due Date" type="date"
                      :rules="[rules.due_date, rules.due_date_threshold]"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.notify_person" label="Notify Person" :items="members" item-title="username" item-value="id" multiple chips clearable
                      :rules="[rules.select]"></v-select>
                  </v-col>

                  <v-col cols="12" sm="6" md="6">
                    <v-text-field v-model="editedItem.estimate" label="Hours Allocated"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.priority" label="Priority" :items="priorities" item-title="title" item-value="value"
                      :rules="[rules.select]"></v-select>
                  </v-col>

                  <v-col cols="12" sm="12" md="12">
                    <v-textarea v-model="editedItem.description" label="Description"></v-textarea>
                  </v-col>

                  <v-col cols="12" sm="12" md="12">
                    <v-text-field label="SharePoint File"></v-text-field>
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
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- <v-dialog v-model="dialogDelete" max-width="500px">
          <v-card>
            <v-card-title class="text-h5">Are you sure you want to delete this item?</v-card-title>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue-darken-1" variant="text" @click="closeDelete">Cancel</v-btn>
              <v-btn color="blue-darken-1" variant="text" @click="deleteItemConfirm">OK</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog> -->
      <!-- </v-toolbar> -->
    </template>

    <template v-slot:item.actions="{ item }">
      <!-- <v-icon size="small" class="me-2" @click="editItem(item.raw)">
        mdi-pencil
      </v-icon> -->
      <!-- <v-icon size="small" @click="deleteItem(item.raw)">
          mdi-delete
        </v-icon> -->
    </template>

    <template v-slot:item.status="{ item }">
      <v-chip :color="getColor(item.raw.status)">
        {{ item.raw.status }}
      </v-chip>
    </template>

    <template v-slot:item.assigned_to="{ item }">
      <v-chip v-for="assignee in item.raw.assigned_to">{{ assignee.username }}</v-chip>
    </template>

    <template v-slot:item.tags="{ item }">
      <!-- <v-chip>{{ item.raw.tags }}</v-chip> -->
      <v-chip v-for="tag in item.raw.tags">{{ tag.name }}</v-chip>
    </template>

    <template v-slot:item.due_date="{ item }">
      {{ convertToDate(item.raw.due_date) }}
    </template>

    <template v-slot:item.description="{ item }">
      <td class="truncate">{{ item.raw.description }}</td>
    </template>

  </v-data-table>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import axios from 'axios'
import { useAuthStore } from '~/store/auth';
    
const authStore = useAuthStore()
const dialog = ref(false)
// const dialogDelete = ref(false)
const itemsPerPage = ref(10)
const loading = ref(true)
const totalItems = ref(0)
const editedIndex = ref(-1)
const data = ref([])
const search = ref('')
const filterByUser = ref(false)
const drawer = ref(false)
const form = ref(null)
const tags = ref([])
const members = ref([])

const headers = [
  { title: 'Name', key: 'name', align: 'start', width: '35%' },
  { title: 'Assignee(s)', key: 'assigned_to', align: 'start', sortable: false },
  { title: 'Type', key: 'tags', align: 'start', sortable: false },
  { title: 'Status', key: 'status', align: 'start', sortable: false },
  { title: 'Priority', key: 'priority', align: 'start', sortable: false },
  { title: 'Due Date', key: 'due_date', align: 'start', sortable: false },
  // { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const editedItem = ref([
  {
    description: '',
    assigned_to: '',
    type: '',
    status: '',
  },
])

const defaultItem = ref([
  {
    description: '',
    assigned_to: '',
    type: '',
    status: '',
  }
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
const statuses = [
  { title: 'Int Request', value: 'Int Request' },
  { title: 'In Progress', value: 'In Progress' },
  { title: 'Internal QC', value: 'Internal QC' },
  { title: 'Post Production', value: 'Post Production' },
  { title: 'Client Review', value: 'Client Review' },
  { title: 'On-hold', value: 'On-hold' },
  { title: 'Scheduled', value: 'Scheduled' },
  { title: 'Done', value: 'Done' },
  { title: 'Complete', value: 'Complete' },
]

// check if API will provide these
// if API provides integer-based values, we will need to map v-data-table to render properly
const contracts = [
  { title: 'Contract 1', value: 'contract1' },
  { title: 'Contract 2', value: 'contract2' },
  { title: 'Contract 3', value: 'contract3' },
]

// check if API will provide these
// if API provides integer-based values, we will need to map v-data-table to render properly
const priorities = [
  { title: 'Low', value: 'Low' },
  { title: 'Normal', value: 'Normal' },
  { title: 'High', value: 'High' },
  { title: 'Urgent', value: 'Urgent' },
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
        let opt = item.assigned_to.some((
            { email }) => email == authStore.currentUser.username)
        return opt
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

// checks for the 2 business days rule
function dateValidation(input) {

  // parse raw input date string
  let parsedInput = input.split('-')
  let inputYear = parsedInput[0]
  let inputMonth = parsedInput[1]
  let inputDay = parsedInput[2]
  let formattedDate = inputMonth + '-' + inputDay + '-' + inputYear

  // initialize the parsed date
  let selectedDate = new Date(formattedDate);

  // get day of week
  let selectedDateDay = selectedDate.getDay()

  // get the current date plus 2 days
  let todaysDate = new Date();
  let todaysDatePlusTwoDays = new Date(todaysDate.setDate(todaysDate.getDate() + 2))
  let thresholdDate = new Date(todaysDatePlusTwoDays.getFullYear(),todaysDatePlusTwoDays.getMonth(),todaysDatePlusTwoDays.getDate())

  // logic to determine if selected date is valid
  if(selectedDateDay !== 0 && selectedDateDay !== 6) {
    if(selectedDate >= thresholdDate) {
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

// mounted life-cycle hook
onMounted(() => {
  loadItems()
  loadTags()
  loadMembers()
})

function loadItems() {
  loading.value = true
  axios.get('https://kai.huberspace.net/tasks/')
  .then((response) => {
    data.value = response.data.data.tasks.map((item) => {
      return {
        // contract: item.contract,
        tags: item.tags,
        status: item.status.status,
        assigned_to: item.assignees,
        due_date: item.due_date,
        // notify_person: item.notify_person,
        estimate: item.time_estimate,
        // priority: item.priority,
        // assigned_to_email_address: item.assigned_to_email_address,
        description: item.text_content,
        name: item.name,
        due_date: item.due_date
      }
    })
    totalItems.value = response.data.data.tasks.length
    loading.value = false
  })
  .catch(err => console.log(err))
}

function loadTags() {
  loading.value = true
  axios.get('https://kai.huberspace.net/tags/')
  .then((response) => {
    tags.value = response.data.data.map((item) => {
      return {
        name: item.name
      }
    })
    loading.value = false
  })
  .catch(err => console.log(err))
}

function loadMembers() {
  loading.value = true
  axios.get('https://kai.huberspace.net/members/')
  .then((response) => {
    members.value = response.data.data.members.map((item) => {
      return {
        id: item.id,
        username: item.username
      }
    })
    loading.value = false
  })
  .catch(err => console.log(err))
}

function editItem(item) {
  editedIndex.value = data.value.indexOf(item)
  editedItem.value = Object.assign({status: "Int Request"}, item)
  dialog.value = true
}

function close() {
  dialog.value = false
  nextTick(() => {
    editedItem.value = Object.assign({}, defaultItem.value)
    editedIndex.value = -1
  })
}

// TODO: assuming API will provide ID
function save() {
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

// color method for v-chip component
function getColor (status) {
  if (status === 'in progress') return 'red'
  else if (status === 'done' || status === 'complete') return 'green'
  else return 'orange'
}

function convertToDate(rawDateTime) {
  let convertedDateTime = Number(rawDateTime)
  return new Date(convertedDateTime).toString()
}

</script>

<style scoped>
.truncate {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>