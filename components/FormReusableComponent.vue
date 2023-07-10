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
  
      <h3 v-if="props.formAction === 'edit'">{{ formTitle }}</h3>
  
      <!-- <v-tabs v-if="props.recordId" v-model="formTab" color="#428086">
        <v-tab value="one" title="Switch to details tab">Details</v-tab>
        <v-tab value="two" title="Switch to comments tab">Comments</v-tab>
      </v-tabs> -->
  
      <!-- <v-window v-model="formTab">
        <v-window-item value="one"> -->
          <v-card :class="scrollingClasses">
            <v-card-title v-if="props.formAction === 'new'">
              <h4>{{ formTitle }}</h4>
            </v-card-title>
  
            <v-card-text>
              <v-form ref="form" @submit.prevent="submit">
                <v-row>
                  <v-col v-for="field in props.fields" :key="field.name" :cols="field.cols" :sm="field.sm" :md="field.md">
                  <v-text-field v-if="field.type == 'text'"
                      v-model="state.formData[field.name]"
                      :label="field.label"
                      :rules="[rules[field.rules]]"
                      :placeholder="field.placeholder"
                  >  
                  </v-text-field>

                  <v-select v-if="field.type == 'select'"
                      v-model="state.formData[field.name]"
                      :label="field.label"
                      :items="field.items"
                      :rules="[rules[field.rules]]"
                  >
                      <!-- <template v-slot:append-item>
                      <v-list-item
                          :title="title"
                          disabled
                      >
                      </v-list-item>
                      </template> -->
                  </v-select>
                  </v-col>
  
                </v-row>
              </v-form>
            </v-card-text>
  
            <v-card-actions>
              <v-row>
                <v-col class="text-right">
                  <v-btn variant="plain" @click="close" title="Cancel">Cancel</v-btn>
                  <!-- <v-btn :disabled="submitBtnDisabled" class="rounded" color="blue" @click="submit" :title="`${ submitBtnText } work order`">{{ submitBtnText }}</v-btn> -->
                  <v-btn :disabled="submitBtnDisabled" class="rounded" color="blue" @click="submit" title="Submit">Submit</v-btn>
                </v-col>
              </v-row>
            </v-card-actions>
          </v-card>
        <!-- </v-window-item> -->
  
        <!-- <v-window-item v-if="props.recordId" value="two"> -->
          <!-- <v-card>
            <v-card-text>
              <comments-comp :taskid="props.recordId" :clickUpUserInfo="clickUpUserInfo"></comments-comp>
            </v-card-text>
          </v-card> -->
          
        <!-- </v-window-item> -->
      <!-- </v-window> -->
      
    </div>
  </template>

<script setup>
import axios from 'axios'
const runtimeConfig = useRuntimeConfig()
const submitBtnDisabled = ref(false)
const submitStatusOverlay = ref(false)
const submitStatus = ref('')
const submitInfo = ref('')

const props = defineProps({
    recordId: String,
    formAction: String,
    formTitle: String,
    fields: Array,
    axiosUrl: String,
    axiosMethod: String,
})

const emit = defineEmits(['close', 'closeAndReload'])

const state = ref({
  formData: {}
})

const form = ref(null)

const formTitle = computed(() => {
  return (props.formAction === 'new') ? 'New ' + props.formTitle + ' Form' : 'Edit ' + props.formTitle + ' Form'
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
      return props.formTitle + ' submitted successfully.'
    case 'updated':
      return props.formTitle + ' updated successfully.'
    default:
      return ''
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
  if (props.formAction === 'new') {
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
  // submitBtnDisabled.value = false
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
  // submitBtnDisabled.value = true
  let method = ''
  let url = ''

  // create a data object that will be passed to API to prevent user from seeing conversions
  let data = Object.assign({}, state.value.formData)

  // since API needs IDs of assignees, pull the assignee(s) ID(s) and store in temp array

  if (props.formAction === 'new') {
    method = props.axiosMethod
    url = `${runtimeConfig.public.API_URL}` + props.axiosUrl
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
          submitStatus.value = (props.formAction === 'new') ? 'success' : 'updated'
          submitInfo.value = (props.formAction === 'new') ? 'Work order URL: ' + window.location.origin + '/workorders?id=' + response.data.data.id : ''
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