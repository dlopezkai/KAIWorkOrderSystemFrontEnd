<template>
  <div v-if="loading" class="pa-1">
    Retrieving data ...
  </div>

  <div v-else-if="!recordFound" class="pa-1">
    Invalid record ID
  </div>

  <div v-else class="pa-1">
    <modal-comp 
      v-model="submitStatusOverlay"
      type="formSubmit"
      :cardTitle="onSubmitMsg"
      :cardText="submitInfo"
      confirmBtnText="OK"
      :submitStatus="submitStatus"
      @confirm="resetSubmitStatus"
    >
    </modal-comp>

    <modal-comp 
      v-model="confirmArchiveOverlay"
      type="warning"
      cardTitle="⚠️ WARNING ⚠️"
      cardText="Archiving this record is not reversible. Please confirm if you would like to proceed."
      cancelBtnText="Cancel"
      confirmBtnText="Confirm"
      @close="closeArchiveConfirmationModal"
      @confirm="save"
    >
    </modal-comp>


    <h3>{{ formTitle }}</h3>

    <v-card flat>
      <v-card-text>
        <v-form ref="form" @submit.prevent="submit" :readonly="readonly">
          <v-row>
            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.name" label="Name" readonly="true"></v-text-field>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.email" label="Email Address" readonly="true"></v-text-field>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-select v-model="editedItem.role" label="Role"
              :items="['admin', 'normal']" :rules="[rules.required]"></v-select>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-row>
          <v-col class="text-right">
            <v-btn variant="plain" @click="close" title="Cancel">Cancel</v-btn>
            <v-btn v-if="!readonly" :disabled="submitBtnDisabled" class="rounded" color="blue" @click="submit" title="Save user">Save</v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import axios from 'axios'

const runtimeConfig = useRuntimeConfig()
const form = ref(null)
const submitBtnDisabled = ref(false)
const submitStatusOverlay = ref(false)
const submitStatus = ref('')
const submitInfo = ref('')
const loading = ref(true)
const confirmArchiveOverlay = ref(false)
const readonly = ref(false)
const recordFound = ref(true)

const props = defineProps({
    recordId: String,
})

const editedItem = ref([
  {
    name: '',
    email: '',
    role: '',
  }
])

const emit = defineEmits(['close', 'closeAndReload'])

// form field validation rules
const rules =
{
  required: v => !!v || 'Field is required',
  emptyArray: v => v.length > 0 || 'Field is required',
  length: v => v.length >= 3 || 'Minimum length is 3 characters',
  select: v => !!v || 'Select a valid option',
  due_date: v => !!v || 'Date must be selected',
  due_date_threshold: v => dateValidation(v) || 'Date must be 2 business days from today',
}

// computed value for form title
const formTitle = computed(() => {
  return (readonly.value) ? 'Archived User Information' : 'Edit User Form'
})

// computed value for project submit progress messages
const onSubmitMsg = computed(() => {
  switch(submitStatus.value) {
    case 'submitting':
      return 'Submitting. Please wait...'
    case 'internal_api_error':
      return 'There was an issue with the API.'
    case 'connection_failure':
      return 'There was an issue submitting your form. Please try again.'
    case 'success':
      return 'User submitted successfully.'
    case 'updated':
      return 'User updated successfully.'
    default:
      return ''
  }
})


onMounted(async () => {
  await loadItem()

  // set form to readonly state if on a record page and project is archived
  if(props.recordId && editedItem.value.isarchived === '1') {
    readonly.value = true
  }
})


async function loadItem() {
  try {
    const response = await axios.get(`${runtimeConfig.public.API_URL}/person/` + props.recordId)
      loading.value = true

        // if not record found, display invalid record message and cease loading page
        if(response.data.data == 0) {
          loading.value = false
          recordFound.value = false
          return
        }

      editedItem.value = Object.assign({}, response.data.data[0])

      // for arrays
      // if(editedItem.value.subtasks) {
      //   let subtasksTemp = []
      //   editedItem.value.subtasks.forEach((subtask) => {
      //     subtasksTemp.push(subtask)
      //   })
      //   editedItem.value.subtasks = subtasksTemp
      // }

      // for objects
      // editedItem.value.status = editedItem.value.status.id
  } catch (err) {
    console.log(err)
  }

  setTimeout(() => {
    loading.value = false
  }, 500)
}


// form submit process
async function submit() {
  const { valid } = await form.value.validate()

  // if archived flag is set to true, display confirmation modal warning that this process is not reversible
  if (valid && editedItem.value.isarchived == 1) {
    confirmArchiveOverlay.value = true
    return
  } else if (valid) {
    save()
  }
}


/*
  Business rule: for should only be PUT request, and should only update the "Role" field
  We are not adding user through front-end. Users are added to the DB via automated job on the backend.
*/
async function save() {
  submitInfo.value = ''
  submitStatus.value = 'submitting'
  submitStatusOverlay.value = true
  submitBtnDisabled.value = true

  let data = Object.assign({}, editedItem.value)  // create a data object that will be passed to API to prevent user from seeing conversions

  try { 
    const response = await axios({
      method: 'PUT',
      url: `${runtimeConfig.public.API_URL}/person/` + props.recordId,
      data: { 'role': data.role },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (response.status === 200) {
      if (response.data.response_code === 200) {
        submitStatus.value = 'updated'
      } else {
        submitStatus.value = 'internal_api_error'
        submitInfo.value = data
        if (response.data.response_code !== 200) {
          console.log(response)
        }
        return
      }
    }
  } catch (err) {
    submitStatus.value = 'connection_failure'
    submitInfo.value = err
    console.log(err)
  }
}


function closeArchiveConfirmationModal() {
  confirmArchiveOverlay.value = false
}


function resetSubmitStatus() {
  submitStatus.value = ''
  submitStatusOverlay.value = false
  submitBtnDisabled.value = false
}


function close() {
  emit('close')
}


</script>

<style lang="scss" scoped>

</style>