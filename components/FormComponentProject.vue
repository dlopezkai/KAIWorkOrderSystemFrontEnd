<template>
  <div v-if="loading && props.formAction === 'edit'" class="pa-1">
    Retrieving data ...
  </div>
  <div v-else class="pa-1">
    <v-overlay v-model="submitStatusOverlay" class="align-center justify-center" persistent>
      <v-container style="height: 400px;">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            <v-card style="font-family:'Open Sans;'">
              <v-card-title>{{ onSubmitMsg }}</v-card-title>
              <v-card-text v-if="submitInfo">{{ submitInfo }}</v-card-text>
              <v-progress-circular v-if="submitStatus === 'submitting'" color="#92D5D5" indeterminate size="64" class="mb-4"></v-progress-circular>
              <v-btn v-if="submitStatus != 'submitting'" color="blue-darken-1" variant="text" class="mb-4" @click="resetSubmitStatus()">
                  OK
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-overlay>

    <v-overlay v-model="confirmArchiveOverlay" class="align-center justify-center" persistent>
      <v-container style="height: 400px;">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            <v-card style="font-family:'Open Sans;'">
              <v-card-title style="background-color:red; color: white">⚠️ WARNING ⚠️</v-card-title>
              <v-spacer></v-spacer>
              <v-card-text>Archiving this record is not reversible. Please confirm if you would like to proceed.</v-card-text>
              <v-card-actions>
                <v-row>
                  <v-col class="text-right">
                    <v-btn variant="plain" @click="closeArchiveConfirmationModal" title="Cancel">Cancel</v-btn>
                    <v-btn class="rounded" color="error" @click="save">Confirm</v-btn>
                  </v-col>
                </v-row>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-overlay>

    <h3 v-if="props.formAction === 'edit'">{{ formTitle }}</h3>

    <v-card :class="scrollingClasses" flat>
      <v-card-title v-if="props.formAction === 'new'">
        <h4>{{ formTitle }}</h4>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" @submit.prevent="submit">
          <v-row>
            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.name" label="Project" 
                :rules="[rules.required]"></v-text-field>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-combobox v-model="editedItem.subtasks" label="Subtask(s)" placeholder="Type in subtask name, and press Enter, or click away"
                :items="editedItem.subtasks" item-title="name" item-value="name" :rules="[rules.required, rules.emptyArray]" chips multiple></v-combobox>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.link" label="SharePoint Link"></v-text-field>
              <v-btn href="https://kauffmaninc.sharepoint.com/" target="_blank" variant="tonal" class="rounded" color="#428086" title="Open SharePoint">Open SharePoint site</v-btn>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-checkbox v-model="editedItem.isarchived" label="Archived" true-value="1" false-value="0"></v-checkbox>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-row>
          <v-col class="text-right">
            <v-btn variant="plain" @click="close" title="Cancel">Cancel</v-btn>
            <v-btn :disabled="submitBtnDisabled" class="rounded" color="blue" @click="submit" :title="`${ submitBtnText } project`">{{ submitBtnText }}</v-btn>
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

const props = defineProps({
    recordId: String,
    formAction: String,
})

const emit = defineEmits(['close', 'closeAndReload'])

const editedItem = ref([
  {
    name: '',
    content: '',
    subtasks: '',
    isarchived: '',
    link: '',
  }
])

// computed value for form title
const formTitle = computed(() => {
  return (!props.recordId) ? 'New Project Form' : 'Edit Project Form'
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

function closeArchiveConfirmationModal() {
  confirmArchiveOverlay.value = false
}

onMounted(async () => {
  await loadItem()
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

function resetSubmitStatus() {
  close()
  submitStatus.value = ''
  submitStatusOverlay.value = false
  submitBtnDisabled.value = false
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

function save() {
  submitInfo.value = ''
  submitStatus.value = 'submitting'
  submitStatusOverlay.value = true
  submitBtnDisabled.value = true
  let method = ''
  let url = ''

  // create a data object that will be passed to API to prevent user from seeing conversions
  let data = Object.assign({}, editedItem.value)

  if (!props.recordId) {
    method = 'post'
    url = `${runtimeConfig.public.API_URL}/project/`
  } else {
    let subtasksTemp = []
    editedItem.value.subtasks.forEach((subtask) => {
      (subtask.name) ? subtasksTemp.push(subtask.name) : subtasksTemp.push(subtask)
    })
    data.subtasks = subtasksTemp

    method = 'put'
    url = `${runtimeConfig.public.API_URL}/project/` + data.id
  }

  axios({
      method: method,
      url: url,
      data: data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(function (response) {
      if (response.status === 200) {
        if (response.data.response_code === 200) {
          submitStatus.value = (!props.recordId) ? 'success' : 'updated'
          submitInfo.value = (!props.recordId) ? 'Project URL: ' + window.location.origin + '/projects?id=' + response.data.data.id : ''
        } else {
          submitStatus.value = 'internal_api_error'
          submitInfo.value = data
          console.log(response)
          return
        }
      }
    })
    .catch(function (error) {
      submitStatus.value = 'connection_failure'
      submitInfo.value = error
      console.log(error)
    })
}
</script>

<style lang="scss" scoped>

</style>