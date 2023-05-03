<template>
  <v-navigation-drawer class="mt-2">
    <v-btn color="blue-darken-1" variant="text" @click="myWorkOrders">
      <v-icon class="mr-2">
        mdi-account-box
      </v-icon>
      My work orders
    </v-btn>
    <v-btn color="blue-darken-1" variant="text" @click="allWorkOrders">
      <v-icon class="mr-2">
        mdi-account-box-multiple
      </v-icon>
      All work orders
    </v-btn>
    <v-btn color="blue-darken-1" variant="text" @click="editItem(item)">
      <v-icon class="mr-2">
        mdi-form-select
      </v-icon>
      Add New Work Order
    </v-btn>
  </v-navigation-drawer>


  <v-data-table-server 
    v-model:items-per-page="itemsPerPage" 
    :headers="headers" 
    :items-length="totalItems"
    :items="serverItems.value" 
    :loading="loading" 
    class="elevation-1" 
    item-value="name" 
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
          <v-card>
            <v-card-title>
              <span class="text-h5">{{ formTitle }}</span>
            </v-card-title>

            <v-card-text>
              <v-form ref="form" @submit.prevent="submit">
                <v-row>
                  <v-col cols="12" sm="12" md="12">
                    <v-text-field v-model="editedItem.wo_name" label="Work order"
                      :rules="[rules.required, rules.length]"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-select v-model="editedItem.type" label="Type" :items="types" item-title="title" item-value="value"
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
                    <v-text-field v-model="editedItem.requester" label="Requested by"></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="6" md="6">
                    <v-text-field v-model="editedItem.contract_name" label="Contract Name"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-text-field v-model="editedItem.contract_number" label="Contract Number"></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="12" md="12">
                    <v-text-field v-model="editedItem.project_manager" label="Project Manager"></v-text-field>
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
      <v-icon size="small" class="me-2" @click="editItem(item.raw)">
        mdi-pencil
      </v-icon>
      <!-- <v-icon size="small" @click="deleteItem(item.raw)">
          mdi-delete
        </v-icon> -->
    </template>

    <template v-slot:item.status="{ item }">
      <v-chip :color="getColor(item.raw.status)">
        {{ item.raw.status }}
      </v-chip>
    </template>

  </v-data-table-server>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const dialog = ref(false)
// const dialogDelete = ref(false)
const itemsPerPage = ref(5)
const loading = ref(true)
const totalItems = ref(0)
const editedIndex = ref(-1)

const headers = [
  { title: 'Number', key: 'wo_number', align: 'start' },
  { title: 'Work order', key: 'wo_name', align: 'start' },
  { title: 'Assignee', key: 'assigned_to', align: 'start', sortable: false },
  { title: 'Type', key: 'type', align: 'start', sortable: false },
  { title: 'Status', key: 'status', align: 'start', sortable: false },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const editedItem = ref([
  {
    wo_number: 0,
    wo_name: '',
    assigned_to: '',
    type: '',
    status: '',
  },
])

const defaultItem = ref([
  {
    wo_number: 0,
    wo_name: '',
    assigned_to: '',
    type: '',
    status: '',
  }
])

// fake data until back-end API is developed
const serverItems = reactive([
  {
    wo_name: 'Lorem ipsum dolor sit amet',
    wo_number: 1,
    contract_name: '',
    contract_number: '',
    task_number: 1000,
    project_manager: 'An Hori',
    requester: 'Some requester',
    type: 'web',
    status: 'In Progress',
    assigned_to: 'Tomo Shinohara',
    due_date: '',
  },
  {
    wo_name: 'consectetur adipiscing elit',
    wo_number: 2,
    contract_name: '',
    contract_number: '',
    task_number: 2000,
    project_manager: 'Tony Shiflett',
    requester: 'Some requester',
    type: 'web',
    status: 'In Progress',
    assigned_to: 'Star Chin',
    due_date: '',
  },
  {
    wo_name: 'sed do eiusmod tempor incididunt',
    wo_number: 3,
    contract_name: '',
    contract_number: '',
    task_number: 3000,
    project_manager: 'William Larocco',
    requester: 'Some requester',
    type: 'web',
    status: 'In Progress',
    assigned_to: 'James Bailey',
    due_date: '',
  },
  {
    wo_name: 'ut labore et dolore magna aliqua',
    wo_number: 4,
    contract_name: '',
    contract_number: '',
    task_number: 65465,
    project_manager: 'An Hori',
    requester: 'Some requester',
    type: 'web',
    status: 'Accepted',
    assigned_to: 'Ola Johnson',
    due_date: '',
  },
  {
    wo_name: 'Ut enim ad minim veniam',
    wo_number: 5,
    contract_name: '',
    contract_number: '',
    task_number: 6844,
    project_manager: 'Tony Shiflett',
    requester: 'Some requester',
    type: 'eBlast',
    status: 'Accepted',
    assigned_to: 'Matthew Myers',
    due_date: '',
  },
  {
    wo_name: 'quis nostrud exercitation ullamco',
    wo_number: 6,
    contract_name: '',
    contract_number: '',
    task_number: 985465,
    project_manager: 'William Larocco',
    requester: 'Some requester',
    type: 'eBlast',
    status: 'Accepted',
    assigned_to: 'David Corlett',
    due_date: '',
  },
  {
    wo_name: 'laboris nisi ut aliquip ex ea commodo consequat',
    wo_number: 7,
    contract_name: '',
    contract_number: '',
    task_number: 66261,
    project_manager: 'An Hori',
    requester: 'Some requester',
    type: 'eBlast',
    status: 'Accepted',
    assigned_to: 'David Corlett',
    due_date: '',
  },
  {
    wo_name: 'Duis aute irure dolor in reprehenderit',
    wo_number: 8,
    contract_name: '',
    contract_number: '',
    task_number: 9685,
    project_manager: 'Tony Shiflett',
    requester: 'Some requester',
    type: 'eBlast',
    status: 'Returned',
    assigned_to: 'Gordon Waltman',
    due_date: '',
  },
  {
    wo_name: 'in voluptate velit esse cillum dolore',
    wo_number: 9,
    contract_name: '',
    contract_number: '',
    task_number: 4584,
    project_manager: 'William Larocco',
    requester: 'Some requester',
    type: 'eBlast',
    status: 'Returned',
    assigned_to: 'Belinda Reinhardt',
    due_date: '',
  },
  {
    wo_name: 'eu fugiat nulla pariatur',
    wo_number: 10,
    contract_name: '',
    contract_number: '',
    task_number: 21545,
    project_manager: 'An Hori',
    requester: 'Some requester',
    type: 'qc request',
    status: 'Returned',
    assigned_to: 'James Vanmeter',
    due_date: '',
  },
  {
    wo_name: 'eu fugiat nulla pariatur',
    wo_number: 11,
    contract_name: '',
    contract_number: '',
    task_number: 21545,
    project_manager: 'An Hori',
    requester: 'Some requester',
    type: 'qc request',
    status: 'Returned',
    assigned_to: 'James Vanmeter',
    due_date: '',
  },
  {
    wo_name: 'eu fugiat nulla pariatur',
    wo_number: 12,
    contract_name: '',
    contract_number: '',
    task_number: 21545,
    project_manager: 'An Hori',
    requester: 'Some requester',
    type: 'qc request',
    status: 'Returned',
    assigned_to: 'James Vanmeter',
    due_date: '',
  },
  {
    wo_name: 'eu fugiat nulla pariatur',
    wo_number: 13,
    contract_name: '',
    contract_number: '',
    task_number: 21545,
    project_manager: 'An Hori',
    requester: 'Some requester',
    type: 'qc request',
    status: 'Returned',
    assigned_to: 'James Vanmeter',
    due_date: '',
  },
])

// fake API to simiulate pulling of data
const FakeAPI = {
  async fetch({ page, itemsPerPage, sortBy }) {
    return new Promise(resolve => {
      setTimeout(() => {
        const start = (page - 1) * itemsPerPage
        const end = start + itemsPerPage
        const items = serverItems.slice()

        if (sortBy.length) {
          const sortKey = sortBy[0].key
          const sortOrder = sortBy[0].order
          items.sort((a, b) => {
            const aValue = a[sortKey]
            const bValue = b[sortKey]
            return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
          })
        }

        const paginated = items.slice(start, end)

        resolve({ items: paginated, total: items.length })
      }, 500)
    })
  },
}

// check if API will provide these
// if API provides integer-based values, we will need to map v-data-table to render properly
const statuses = [
  { title: '-- Select --', value: '' },
  { title: 'In Progress', value: 'In Progress' },
  { title: 'Accepted', value: 'Accepted' },
  { title: 'Returned', value: 'Returned' },
]

// check if API will provide these
// if API provides integer-based values, we will need to map v-data-table to render properly
const types = [
  { title: '-- Select --', value: '' },
  { title: 'web', value: 'web' },
  { title: 'eBlast', value: 'eBlast' },
  { title: 'qc request', value: 'qc request' },
]

// computed value for form title
const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'New Item' : 'Edit Item'
})

// form field validation rules
const rules =
{
  required: v => !!v || 'Field is required',
  length: v => v.length >= 3 || 'Minimum length is 3 characters',
  select: v => !!v || 'Select a valid option',
}

const form = ref(null)

// form submit process
async function submit() {
  const { valid } = await form.value.validate()
  if (valid) {
    alert(JSON.stringify(editedItem.value, null, 2))
    save()
  }
}

function loadItems({ page, itemsPerPage, sortBy }) {
  loading.value = true
  FakeAPI.fetch({ page, itemsPerPage, sortBy }).then(({ items, total }) => {
    serverItems.value = items
    totalItems.value = total
    loading.value = false
  })
}

function editItem(item) {
  editedIndex.value = serverItems.indexOf(item)
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

function save() {
  if (editedIndex.value > -1) {
    Object.assign(serverItems[editedIndex.value], editedItem.value)
  } else {
    serverItems.push(editedItem.value)
  }
  close()
}

// function deleteItem(item) {
//     editedIndex.value = serverItems.indexOf(item)
//     editedItem.value = Object.assign({}, item)
//     dialogDelete.value = true
// }

// function deleteItemConfirm() {
//     serverItems.value.splice(editedIndex.value, 1)
//     closeDelete()
// }

// function closeDelete() {
//     dialogDelete.value = false
//     nextTick(() => {
//         editedItem.value = Object.assign({}, defaultItem.value)
//         editedIndex.value = -1
//     })
// }

function myWorkOrders() {
  alert("This will display logged-in user's work orders")
}

function allWorkOrders() {
  alert("This will display all work orders")
}

// color method for v-chip component
function getColor (status) {
  if (status === 'In Progress') return 'red'
  else if (status === 'Accepted') return 'green'
  else return 'orange'
}

</script>