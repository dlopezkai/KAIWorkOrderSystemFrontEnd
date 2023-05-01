<template>
  <v-data-table-server v-model:items-per-page="itemsPerPage" :headers="headers" :items-length="totalItems"
    :items="serverItems" :loading="loading" class="elevation-1" item-value="name" @update:options="loadItems">
    <template v-slot:top>
      <!-- <v-toolbar
        flat
      > -->

      <v-dialog v-model="dialog" max-width="800px">
        <!-- <template v-slot:activator="{ props }">
          <v-btn color="primary" dark class="mb-2" v-bind="props">
            New Item
          </v-btn>
        </template> -->
        <v-card>
          <v-card-title>
            <span class="text-h5">{{ formTitle }}</span>
          </v-card-title>

          <!-- <v-container>
            <form @submit.prevent="submit">
              <v-row>
                <v-col cols="12" sm="12" md="12">
                  <v-text-field v-model="text.value.value" :counter="10" :error-messages="text.errorMessage.value"
                    label="Work Order"></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6" md="6">
                  <v-text-field v-model="email.value.value" :error-messages="email.errorMessage.value"
                    label="Work Order Type"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <v-select v-model="select.value.value" :items="wo_statuses" :error-messages="select.errorMessage.value"
                    label="Status"></v-select>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6" md="6">
                  <v-text-field v-model="phone.value.value" :counter="7" :error-messages="phone.errorMessage.value"
                    label="Assignee"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <v-select v-model="select.value.value" :items="items" :error-messages="select.errorMessage.value"
                    label="Requested by"></v-select>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6" md="6">
                  <v-text-field v-model="email.value.value" :error-messages="email.errorMessage.value"
                    label="Contract Name"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <v-select v-model="select.value.value" :items="items" :error-messages="select.errorMessage.value"
                    label="Contract Number"></v-select>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6" md="6">
                  <v-text-field v-model="email.value.value" :error-messages="email.errorMessage.value"
                    label="Project Manager"></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-btn class="me-4" type="submit">
                  submit
                </v-btn>

                <v-btn @click="handleReset">
                  clear
                </v-btn>
              </v-row>
            </form>
          </v-container> -->

          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12" sm="12" md="12">
                  <v-text-field v-model="editedItem.wo_name" label="Work order"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <v-select v-model="editedItem.type" label="Type" :items="types"></v-select>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <v-select v-model="editedItem.status" label="Status" :items="statuses"></v-select>
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
              </v-row>
            </v-container>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-darken-1" variant="text" @click="close">
              Cancel
            </v-btn>
            <v-btn color="blue-darken-1" variant="text" @click="save">
              Save
            </v-btn>
          </v-card-actions>
        </v-card>


      </v-dialog>

      <v-dialog v-model="dialogDelete" max-width="500px">
        <v-card>
          <v-card-title class="text-h5">Are you sure you want to delete this item?</v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-darken-1" variant="text" @click="closeDelete">Cancel</v-btn>
            <v-btn color="blue-darken-1" variant="text" @click="deleteItemConfirm">OK</v-btn>
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <!-- </v-toolbar> -->
    </template>

    <template v-slot:item.actions="{ item }">
      <v-icon size="small" class="me-2" @click="editItem(item.raw)">
        mdi-pencil
      </v-icon>
      <v-icon size="small" @click="deleteItem(item.raw)">
        mdi-delete
      </v-icon>
    </template>
  </v-data-table-server>
</template>


<script>
// import { ref } from 'vue'
// import { useField, useForm } from 'vee-validate'

// fake data until back-end API is developed
const serverItems = [
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
]

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

export default {
  // setup() {
  //   const { handleSubmit, handleReset } = useForm({
  //     validationSchema: {
  //       text(value) {
  //         console.log('test' + value)
  //         if (value?.length >= 2) return true

  //         return 'Field needs to be at least 2 characters.'
  //       },
  //       phone(value) {
  //         if (value?.length > 9 && /[0-9-]+/.test(value)) return true

  //         return 'Phone number needs to be at least 9 digits.'
  //       },
  //       email(value) {
  //         if (/^[a-z.-]+@[a-z.-]+\.[a-z]+$/i.test(value)) return true

  //         return 'Must be a valid e-mail.'
  //       },
  //       select(value) {
  //         if (value) return true

  //         return 'Select an item.'
  //       },
  //       checkbox(value) {
  //         if (value === '1') return true

  //         return 'Must be checked.'
  //       },
  //     },
  //   })
  //   const text = useField('text')
  //   const phone = useField('phone')
  //   const email = useField('email')
  //   const select = useField('select')
  //   const checkbox = useField('checkbox')

  //   const wo_statuses = ref([
  //     'In Progress',
  //     'Accepted',
  //     'Returned',
  //   ])

  //   const submit = handleSubmit(values => {
  //     alert(JSON.stringify(values, null, 2))
  //   })

  //   return { text, phone, email, select, checkbox, wo_statuses, submit, handleReset }
  // },


  data: () => ({
    dialog: false,
    dialogDelete: false,
    itemsPerPage: 5,
    headers: [
      {
        title: 'Number',
        align: 'start',
        sortable: false,
        key: 'wo_number',
      },
      { title: 'Work order', key: 'wo_name', align: 'start' },
      { title: 'Assignee', key: 'assigned_to', align: 'start' },
      { title: 'Type', key: 'type', align: 'start' },
      { title: 'Status', key: 'status', align: 'start' },
      { title: 'Actions', key: 'actions', align: 'end', sortable: false },
    ],
    serverItems: [],
    loading: true,
    totalItems: 0,

    editedIndex: -1,
    editedItem: {
      wo_number: 0,
      wo_name: '',
      assigned_to: '',
      type: '',
      status: '',
    },
    defaultItem: {
      wo_number: 0,
      wo_name: '',
      assigned_to: '',
      type: '',
      status: '',
    },

    // default statuses
    statuses: [
      'In Progress',
      'Accepted',
      'Returned',
    ],

    // default types
    types: [
      'web',
      'eBlast',
      'qc request',
    ]
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
    },
  },

  methods: {
    loadItems({ page, itemsPerPage, sortBy }) {
      this.loading = true
      FakeAPI.fetch({ page, itemsPerPage, sortBy }).then(({ items, total }) => {
        this.serverItems = items
        this.totalItems = total
        this.loading = false
      })
    },

    editItem(item) {
      this.editedIndex = this.serverItems.indexOf(item)
      this.editedItem = Object.assign({}, item)
      this.dialog = true
    },

    deleteItem(item) {
      this.editedIndex = this.serverItems.indexOf(item)
      this.editedItem = Object.assign({}, item)
      this.dialogDelete = true
    },

    deleteItemConfirm() {
      this.serverItems.splice(this.editedIndex, 1)
      this.closeDelete()
    },

    close() {
      this.dialog = false
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      })
    },

    closeDelete() {
      this.dialogDelete = false
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem)
        this.editedIndex = -1
      })
    },

    save() {
      if (this.editedIndex > -1) {
        Object.assign(this.serverItems[this.editedIndex], this.editedItem)
      } else {
        this.serverItems.push(this.editedItem)
      }
      this.close()
    },
  },
}
</script>