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
                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.contract" label="Contract" :items="contracts" item-title="title" item-value="value"
                      :rules="[rules.select]"></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.tags" label="Type" :items="types" item-title="title" item-value="value" multiple chips clearable
                      :rules="[rules.select]"></v-select>
                  </v-col>

                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.status" label="Status" :items="statuses" item-title="title"
                      item-value="value" :rules="[rules.select]"></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-text-field v-model="editedItem.assigned_to" label="Assignee"></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="6" md="6">
                    <v-text-field v-model="editedItem.due_date" label="Due Date" type="date"
                      :rules="[rules.due_date]"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.notify_person" label="Notify Person" :items="staff" item-title="title" item-value="value" multiple chips clearable
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

const headers = [
  { title: 'Number', key: 'wo_number', align: 'start' },
  { title: 'Description', key: 'description', align: 'start' },
  { title: 'Assignee', key: 'assigned_to', align: 'start', sortable: false },
  { title: 'Type', key: 'type', align: 'start', sortable: false },
  { title: 'Status', key: 'status', align: 'start', sortable: false },
  { title: 'Priority', key: 'priority', align: 'start', sortable: false },
  // { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const editedItem = ref([
  {
    wo_number: 0,
    description: '',
    assigned_to: '',
    type: '',
    status: '',
  },
])

const defaultItem = ref([
  {
    wo_number: 0,
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
  { title: '-- Select --', value: '' },
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
const types = [
  { title: '-- Select --', value: '' },
  { title: 'Writing', value: 'Writing' },
  { title: 'Editing', value: 'Editing' },
  { title: 'Graphics', value: 'Graphics' },
  { title: '508 Compliance', value: '508 Compliance' },
  { title: 'Video/Audio', value: 'Video/Audio' },
  { title: 'Social Media', value: 'Social Media' },
  { title: 'Web', value: 'Web' },
  { title: 'Eblast', value: 'Eblast' },
]

// check if API will provide these
// if API provides integer-based values, we will need to map v-data-table to render properly
const contracts = [
  { title: '-- Select --', value: '' },
  { title: 'Contract 1', value: 'contract1' },
  { title: 'Contract 2', value: 'contract2' },
  { title: 'Contract 3', value: 'contract3' },
]

// check if API will provide these
// if API provides integer-based values, we will need to map v-data-table to render properly
const priorities = [
  { title: '-- Select --', value: '' },
  { title: 'Low', value: 'Low' },
  { title: 'Normal', value: 'Normal' },
  { title: 'High', value: 'High' },
  { title: 'Urgent', value: 'Urgent' },
]

// check if API will provide these
// if API provides integer-based values, we will need to map v-data-table to render properly
const staff = [
  { title: '-- Select --', value: '' },
  { title: 'Hollie Austin', value: 'staff1' },
  { title: 'Jeremiah Simmons', value: 'staff2' },
  { title: 'Leanne Galvan', value: 'staff3' },
  { title: 'Freddie Johnston', value: 'staff4' },
  { title: 'Junaid Howe', value: 'staff5' },
  { title: 'Casper Pennington', value: 'staff6' },
]

// computed value for form title
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'New Work Order Form' : 'Edit Work Order Form'
})

// computed value for filtering data by logged-in user 
// checks work order's assignee's email address against logged-in user's AD email
const filteredData = computed(() => {
  if(filterByUser.value){
    return data.value.filter(item => item.assigned_to_email_address == authStore.currentUser.username)
  }
  return data.value
})

// form field validation rules
const rules =
{
  required: v => !!v || 'Field is required',
  length: v => v.length >= 3 || 'Minimum length is 3 characters',
  select: v => !!v || 'Select a valid option',
  due_date: v => console.log(v)
}

const form = ref(null)

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
})

function loadItems() {
  loading.value = true
  axios.get('test2.json')
  .then((response) => {
      data.value = response.data.serverItems.map((item) => {
          return {
              wo_number: item.wo_number,
              contract: item.contract,
              tags: item.tags,
              status: item.status,
              assigned_to: item.assigned_to,
              due_date: item.due_date,
              notify_person: item.notify_person,
              estimate: item.estimate,
              priority: item.priority,
              assigned_to_email_address: item.assigned_to_email_address,
              description: item.description
          }
        })
      totalItems.value = response.data.serverItems.length
      loading.value = false
  })
  .catch(err => console.log(err))
}

function editItem(item) {
  editedIndex.value = data.value.indexOf(item)
  editedItem.value = Object.assign({}, item)
  dialog.value = true
}

function close() {
  dialog.value = false
  nextTick(() => {
    editedItem.value = Object.assign({}, defaultItem.value)
    editedIndex.value = -1
  })
}

// TODO: assuming API will provide ID, we'll need to remove wo_number incrementer 
function save() {
  if (editedIndex.value > -1) {
    axios.post('test2.json', JSON.stringify(editedItem.value, null, 2))
    Object.assign(data.value[editedIndex.value], editedItem.value)
  } else {
    axios.post('test2.json', JSON.stringify(editedItem.value, null, 2))
    editedItem.value.wo_number = data.value.length + 1
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
  if (status === 'In Progress') return 'red'
  else if (status === 'Done' || status === 'Complete') return 'green'
  else return 'orange'
}

</script>