<template>
  <div v-if="loading && props.formAction === 'edit'" class="pa-1">
    Retrieving data ...
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


    <h3 v-if="props.formAction === 'edit'">{{ formTitle }}</h3>

    <v-card :class="scrollingClasses" flat>
      <v-card-title v-if="props.formAction === 'new'">
        <h4>{{ formTitle }}</h4>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" @submit.prevent="submit" :readonly="readonly">
          <v-row>
            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.name" label="Name" 
                :rules="[rules.required]" readonly="true"></v-text-field>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.email" label="Email Address" 
                :rules="[rules.required]" readonly="true"></v-text-field>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-select v-model="editedItem.role" label="Role"
              :items="['Admin', 'Normal']" :rules="[rules.required]"></v-select>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-row>
          <v-col class="text-right">
            <v-btn variant="plain" @click="close" title="Cancel">Cancel</v-btn>
            <v-btn v-if="!readonly" :disabled="submitBtnDisabled" class="rounded" color="blue" @click="submit" :title="`${ submitBtnText } user`">{{ submitBtnText }}</v-btn>
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

const props = defineProps({
    recordId: String,
    formAction: String,
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
  return (!props.recordId) ? 'New User Form' : 
    (readonly.value) ? 'Archived User Information' : 'Edit User Form'
})

// computed value for save/submit button text
const submitBtnText = computed(() => {
  return (!props.recordId) ? 'Submit' : 'Save'
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

// computed CSS class to control scrolling of the form
const scrollingClasses = computed(() => {
  if (props.formAction === 'new') {
    return 'overflow-y-auto modal-form'
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
  if (props.recordId) {
    try {
      const response = await axios.get(`${runtimeConfig.public.API_URL}/person/` + props.recordId)
        loading.value = true
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
  } else {
    editedItem.value = Object.assign({}, '')
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
  Backend is setup in a way that we need to perform two seperate POST request
  - One for Project.
  - One for Subtasks (using the ID obtained in the response body of the Project POST).
  - Since subtask only takes one single name, will need to iterate through array and do a POST request for each subtask.
*/
async function save() {
  submitInfo.value = ''
  submitStatus.value = 'submitting'
  submitStatusOverlay.value = true
  submitBtnDisabled.value = true
  let projectId = ''

  let data = Object.assign({}, editedItem.value)  // create a data object that will be passed to API to prevent user from seeing conversions

  let subtasksTemp = []
  editedItem.value.subtasks.forEach((subtask) => {
    (subtask.name) ? subtasksTemp.push(subtask.name) : subtasksTemp.push(subtask)
  })
  data.subtasks = subtasksTemp


  try { 
    if (!props.recordId) {
      const projectPostRes = await axios({
        method: 'POST',
        url: `${runtimeConfig.public.API_URL}/project/`,
        data: { 'name': data.name, 'link': data.link, 'billing_code': data.billing_code },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      
      projectId = projectPostRes.data.data.id

      data.subtasks.forEach(async (subtask) => {
        const subtasksPostRes = await axios({
          method: 'POST',
          url: `${runtimeConfig.public.API_URL}/project/` + projectId + `/subtask`,
          data: { 'name': subtask },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })

        if (projectPostRes.status === 200 && subtasksPostRes.status === 200) {
          if (projectPostRes.data.response_code === 200 && subtasksPostRes.data.response_code === 200) {
            submitStatus.value = (!props.recordId) ? 'success' : 'updated'
            submitInfo.value = (!props.recordId) ? 'Project URL: ' + window.location.origin + '/projects?id=' + projectId : ''
          } else {
            submitStatus.value = 'internal_api_error'
            submitInfo.value = data
            if (projectPostRes.data.response_code !== 200) {
              console.log(projectPostRes)
            }
            if (subtasksPostRes.data.response_code !== 200) {
              console.log(subtasksPostRes)
            }
            return
          }
        }
      })

    } else {
      // PUT requests here...
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
  close()
  submitStatus.value = ''
  submitStatusOverlay.value = false
  submitBtnDisabled.value = false
}


function close() {
  if (!props.recordId) {
    if(submitStatus.value === 'success') {
      emit('closeAndReload')
    } else {
      emit('close')
    }
  } else {
    emit('close')
  }
}


</script>

<style lang="scss" scoped>

</style>