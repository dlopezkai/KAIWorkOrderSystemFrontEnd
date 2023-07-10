<template>
  <div v-if="loading && props.formAction === 'edit'" class="pa-5">
    Retrieving data ...
  </div>
  <div v-else class="pa-5">
    <v-overlay v-model="submitStatusOverlay" class="align-center justify-center" persistent>
      <v-container style="height: 400px;">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            <v-card style="font-family:'Open Sans;">
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

    <!-- <h3 v-if="props.formAction === 'edit'">{{ formTitle }}</h3> -->

    <v-card :class="scrollingClasses">
      <v-card-title>
        <h4>{{ formTitle }}</h4>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" @submit.prevent="submit">
          <v-row>
            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.project" label="Project" 
                :rules="[rules.required]"></v-text-field>
            </v-col>

            <v-col cols="12" sm="12" md="12">
              <v-text-field v-model="editedItem.subtask" label="Subtask(s)" placeholder="Multiple subtask format: &quot;subtask1, subtask2&quot; (no quotes)"
                :rules="[rules.required]"></v-text-field>
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
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const form = ref(null)
const submitBtnDisabled = ref(false)
const submitStatusOverlay = ref(false)
const submitStatus = ref('')
const submitInfo = ref('')

const props = defineProps({
    recordId: String,
    formAction: String,
})

const emit = defineEmits(['close', 'closeAndReload'])

const editedItem = ref([
  {
    project: '',
    subtask: '',
  }
])

// computed value for form title
const formTitle = computed(() => {
  return (!route.params.id) ? 'New Project Form' : 'Edit Project Form'
})

// computed value for save/submit button text
const submitBtnText = computed(() => {
  return (!props.recordId) ? 'Submit' : 'Save'
})

// computed value for work order submit progress messages
const onSubmitMsg = computed(() => {
  switch(submitStatus.value) {
    case 'submitting':
      return 'Submitting. Please wait...'
    case 'internal_api_error':
      return 'There was an issue with the API.'
    case 'connection_failure':
      return 'There was an issue submitting your form. Please try again.'
    case 'success':
      return 'Work order submitted successfully.'
    case 'updated':
      return 'Work order updated successfully.'
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

function resetSubmitStatus() {
  close()
  submitStatus.value = ''
  submitStatusOverlay.value = false
  submitBtnDisabled.value = false
}

// form submit process
async function submit() {
  const { valid } = await form.value.validate()
  if (valid) {
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
          submitInfo.value = (!props.recordId) ? 'Work order URL: ' + window.location.origin + '/workorders?id=' + response.data.data.id : ''
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