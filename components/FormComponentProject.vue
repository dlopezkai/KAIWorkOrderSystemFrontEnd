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

    <modal-comp 
      v-model="editSubtaskOverlay"
      type="form"
      cardTitle="Edit subtask"
      cancelBtnText="Cancel"
      confirmBtnText="Confirm"
      :fields="editedSubtask"
      @close="closeAndClearEditSubtaskModal"
      @confirm="updateSubtask"
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
              <v-text-field v-model="editedItem.name" label="Project" 
                :rules="[rules.required]"></v-text-field>
            </v-col>

            <v-col v-if="!props.recordId" cols="12" sm="12" md="12">
              <v-combobox v-model="editedItem.subtasks" label="Subtask(s)" placeholder="Type in subtask name, and press Enter, or click away"
                :items="editedItem.subtasks" item-title="name" item-value="name" :rules="[rules.required, rules.emptyArray]" chips multiple></v-combobox>
            </v-col>

            <v-col v-if="props.recordId" cols="12" sm="12" md="12">
              <v-label class="mr-2">Subtasks:</v-label>
              <v-chip v-for="subtask in editedItem.subtasks" @click="openEditSubtaskModal(subtask)" :disabled="readonly">
                {{ subtask.name }}
              </v-chip>

              <v-btn v-if="!readonly" color="blue" variant="plain" title="Add more subtasks" @click="displayAddNewSubtaskField=true">
                Add more subtasks
              </v-btn>
            </v-col>

            <v-col v-if="props.recordId && displayAddNewSubtaskField" cols="12" sm="12" md="12">
              <v-combobox v-model="editedItem.newSubtasks" label="New subtasks(s)" placeholder="Add new subtasks here"
                :items="editedItem.newSubtasks" item-title="name" item-value="name" chips multiple>
              </v-combobox>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.billing_code" label="Billing Code" 
                :rules="[rules.required]"></v-text-field>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.link" label="SharePoint Link"></v-text-field>
              <v-btn v-if="!readonly" href="https://kauffmaninc.sharepoint.com/" target="_blank" variant="tonal" class="rounded" color="#428086" title="Open SharePoint">Open SharePoint site</v-btn>
            </v-col>

            <v-col v-if="props.recordId" cols="12" sm="12" md="12">
              <v-checkbox v-model="editedItem.isarchived" label="Archived" true-value="1" false-value="0" :readonly="readonly"></v-checkbox>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-row>
          <v-col class="text-right">
            <v-btn variant="plain" @click="close" title="Cancel">Cancel</v-btn>
            <v-btn v-if="!readonly" :disabled="submitBtnDisabled" class="rounded" color="blue" @click="submit" :title="`${ submitBtnText } project`">{{ submitBtnText }}</v-btn>
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
const editSubtaskOverlay = ref(false)
const displayAddNewSubtaskField = ref(false)

const props = defineProps({
    recordId: String,
    formAction: String,
})

const editedItem = ref([
  {
    name: '',
    content: '',
    subtasks: '',
    billing_code: '',
    isarchived: '',
    link: '',
  }
])

const editedSubtask = ref()

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
  return (!props.recordId) ? 'New Project Form' : 
    (readonly.value) ? 'Archived Project Information' : 'Edit Project Form'
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
      return 'Project submitted successfully.'
    case 'updated':
      return 'Project updated successfully.'
    case 'updated_subtask':
      return 'Subtask updated successfully.'
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
      const response = await axios.get(`${runtimeConfig.public.API_URL}/project/` + props.recordId)
        loading.value = true
        editedItem.value = Object.assign({}, response.data.data[0])

        // for arrays
        if(editedItem.value.subtasks) {
          let subtasksTemp = []
          editedItem.value.subtasks.forEach((subtask) => {
            subtasksTemp.push(subtask)
          })
          editedItem.value.subtasks = subtasksTemp
        }

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

  try { 
    const projectRequestResponse = await axios({
      method: (!props.recordId) ? 'POST' : 'PUT',
      url: (!props.recordId) ? `${runtimeConfig.public.API_URL}/project/` : `${runtimeConfig.public.API_URL}/project/` + data.id,
      data: (!props.recordId) ? { 'name': data.name, 'link': data.link, 'billing_code': data.billing_code } 
        : { 'name': data.name, 'link': data.link, 'billing_code': data.billing_code, 'isarchived': data.isarchived },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    
    projectId = (!props.recordId) ? projectRequestResponse.data.data.id : data.id

    if(data.subtasks || data.newSubtasks) {
      if (props.recordId) {
        data.subtasks = data.newSubtasks
      }
      
      if(data.subtasks) {
        data.subtasks.forEach(async (subtask) => {
          const subtasksRequestResponse = await axios({
            method: 'POST',
            url: `${runtimeConfig.public.API_URL}/project/` + projectId + `/subtask`,
            data: { 'name': subtask },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })

          if (projectRequestResponse.status === 200 && subtasksRequestResponse.status === 200) {
            if (projectRequestResponse.data.response_code === 200 && subtasksRequestResponse.data.response_code === 200) {
              submitStatus.value = (!props.recordId) ? 'success' : 'updated'
              submitInfo.value = (!props.recordId) ? 'Project URL: ' + window.location.origin + '/projects?id=' + projectId : ''
              if(props.recordId) {
                editedItem.value.subtasks.push(subtasksRequestResponse.data.data)
                delete editedItem.value.newSubtasks
                displayAddNewSubtaskField.value = false
              }

            } else {
              submitStatus.value = 'internal_api_error'
              submitInfo.value = data
              if (projectRequestResponse.data.response_code !== 200) {
                console.log(projectRequestResponse)
              }
              if (subtasksRequestResponse.data.response_code !== 200) {
                console.log(subtasksRequestResponse)
              }
              return
            }
          }
        })
      } else {
        if (projectRequestResponse.status === 200) {
          if (projectRequestResponse.data.response_code === 200) {
            submitStatus.value = 'updated'
          } else {
            submitStatus.value = 'internal_api_error'
            submitInfo.value = data
            if (projectRequestResponse.data.response_code !== 200) {
              console.log(projectRequestResponse)
            }
            return
          }
        }
      }
    }
  } catch (err) {
    submitStatus.value = 'connection_failure'
    submitInfo.value = err
    console.log(err)
  }
}


function openEditSubtaskModal(subtask) {
  // grab the incoming subtask array index
  let indexValue = editedItem.value.subtasks.map( subtask => subtask.id ).indexOf(subtask.id)

  let subtaskArr = []
  const editableKeys = ['name'] // pick what fields are needed here...
  for (const key in subtask) {
    if(editableKeys.includes(key)) {
      if (subtask.hasOwnProperty(key)) {
        const obj = { id: subtask['id'], name: key, value: subtask[key], index: indexValue }
        subtaskArr.push(obj)
      }
    }
  }

  // assign subtask object to reactive field (to be used by form)
  editedSubtask.value = subtaskArr

  // open a modal with a (text) field bound to editedSubtask.value.name property
  editSubtaskOverlay.value = true
}


async function updateSubtask(subtask) {
  submitInfo.value = ''
  submitStatus.value = 'submitting'
  submitStatusOverlay.value = true

  try { 
    const response = await axios({
      method: 'PUT',
      url: `${runtimeConfig.public.API_URL}/subtask/` + subtask[0].id,
      data: { 'name': subtask[0].value },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (response.status === 200) {
      if (response.data.response_code === 200) {
        submitStatus.value = 'updated_subtask'

        // update subtask name for the given subtask array's index
        editedItem.value.subtasks[subtask[0].index].name = subtask[0].value
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

  // close modal and reset field
  closeAndClearEditSubtaskModal()
}


function closeAndClearEditSubtaskModal() {
  editedSubtask.value = Object.assign({}, '')
  editSubtaskOverlay.value = false
}


function closeArchiveConfirmationModal() {
  displayAddNewSubtaskField.value = false
  confirmArchiveOverlay.value = false
}


function resetSubmitStatus() {
  if(!props.recordId) close()
  
  submitStatus.value = ''
  submitStatusOverlay.value = false
  submitBtnDisabled.value = false

  // put form in readonly state after save if archive flag is set to true
  if(props.recordId) {
    if(editedItem.value.isarchived == 1) {
      readonly.value = true
    }
  }

  closeArchiveConfirmationModal()
}


function close() {
  if(submitStatus.value === 'success') {
    emit('closeAndReload')
  } else {
    emit('close')
  }
}


</script>

<style lang="scss" scoped>

</style>