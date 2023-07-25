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

    <h3 v-if="props.formAction === 'edit'">{{ formTitle }}</h3>

    <v-tabs v-if="props.recordId" v-model="formTab" color="#428086">
      <v-tab value="one" title="Switch to details tab">Details</v-tab>
      <v-tab value="two" title="Switch to comments tab">Comments</v-tab>
    </v-tabs>

    <v-window v-model="formTab">
      <v-window-item value="one">
        <v-card :class="scrollingClasses">
          <v-card-title v-if="props.formAction === 'new'">
            <h4>{{ formTitle }}</h4>
          </v-card-title>

          <v-card-text>
            <v-form ref="form" @submit.prevent="submit">
              <v-row>
                <v-col cols="12" sm="12" md="12">
                  <v-text-field v-model="editedItem.name" label="Name" 
                    :rules="[rules.required]"></v-text-field>
                </v-col>

                <v-col cols="12" sm="6" md="6">
                  <v-select v-model="editedItem.project" label="Project" :items="projects" item-title="name" item-value="id" @update:modelValue="resetAndReloadSubtasks()" :rules="[rules.select]"></v-select>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <v-select v-model="editedItem.subtask" label="Subtask" :items="subtasks" item-title="name" item-value="id" :rules="[rules.select]"></v-select>
                </v-col>

                <v-col cols="12" sm="12" md="12">
                  <v-select v-model="editedItem.tags" label="Type" :items="tags" item-title="title" item-value="value" multiple chips clearable></v-select>
                </v-col>

                <v-col v-if="props.recordId" cols="12" sm="6" md="6">
                  <v-select v-model="editedItem.status" label="Status" :items="statuses" item-title="title" item-value="id"></v-select>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <v-autocomplete v-model="editedItem.assignees" label="Assignee(s)" :items="persons" item-title="title" item-value="value" multiple chips clearable></v-autocomplete>
                </v-col>

                <v-col cols="12" sm="6" md="6">
                  <v-text-field v-model="editedItem.due_date" label="Due Date" type="date" :rules="[rules.due_date_threshold]" clearable></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <v-autocomplete v-model="editedItem.watchers" label="Notify Person" :items="persons" item-title="title" item-value="value" multiple chips clearable></v-autocomplete>
                </v-col>

                <v-col cols="12" sm="6" md="6">
                  <v-text-field v-model="editedItem.time_estimate" label="Budgeted Hours"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="6">
                  <v-select v-model="editedItem.priority" label="Priority" :items="priorities" item-title="title" item-value="id" :hint="priorityMessages" persistent-hint></v-select>
                </v-col>

                <v-col cols="12" sm="12" md="12">
                  <QuillEditor
                    v-model:content="editedItem.description" 
                    contentType="html" 
                    theme="snow" 
                    placeholder="Description"
                    toolbar="essential" 
                    style="height:200px; max-height:250px;"
                  ></QuillEditor>
                </v-col>

                <v-col cols="12" sm="12" md="12" class="mt-5">
                  <v-text-field v-model="editedItem.links" label="SharePoint File"></v-text-field>
                  <v-btn href="https://kauffmaninc.sharepoint.com/" target="_blank" variant="tonal" class="rounded" color="#428086" title="Open SharePoint">Open SharePoint site</v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-row>
              <v-col class="text-right">
                <v-btn variant="plain" @click="close" title="Cancel">Cancel</v-btn>
                <v-btn :disabled="submitBtnDisabled" class="rounded" color="blue" @click="submit" :title="`${ submitBtnText } work order`">{{ submitBtnText }}</v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <v-window-item v-if="props.recordId" value="two">
        <v-card>
          <v-card-text>
            <comments-comp :workorderid="props.recordId" :userInfo="props.userInfo"></comments-comp>
          </v-card-text>
        </v-card>
        
      </v-window-item>
    </v-window>
    
  </div>
</template>

<script setup>
import axios from 'axios'
import { useAuthStore } from '~/store/auth';
import CommentsComp from './CommentsComp.vue';
import { convertToDate, hoursToMinutes, minutesToHours } from '~/helpers/datetimeConversions.js';
import { capitalizeFirstLetter } from '~/helpers/capitalizeFirstLetter.js';
import '~/assets/css/main.css'

const loading = ref(true)
const runtimeConfig = useRuntimeConfig()
const authStore = useAuthStore()
const tags = ref([])
const persons = ref([])
const projects = ref([])
const subtasks = ref([])
const statuses = ref([])
const priorities = ref([])
const form = ref(null)
const formTab = ref(null)
const submitBtnDisabled = ref(false)
const submitStatusOverlay = ref(false)
const submitStatus = ref('')
const submitInfo = ref('')
const props = defineProps({
    recordId: String,
    formAction: String,
    userInfo: Object,
})

const emit = defineEmits(['close', 'closeAndReload'])

const editedItem = ref([
  {
    assignees: '',
    creator: '',
    description: '',
    due_date: '',
    project: '',
    id: '',
    links: '',
    subtask: '',
    name: '',
    priority: '',
    project: '',
    status: '',
    tags: '',
    time_estimate: '',
    watchers: ''
  },
])

// computed value for form title
const formTitle = computed(() => {
  return (!props.recordId) ? 'New Work Order Form' : 'Edit Work Order Form'
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

// computed value for priority SLA messages
const priorityMessages = computed(() => {
  if (editedItem.value.priority === null || editedItem.value.priority === undefined) {
    return ''
  } else {
    const index = (typeof editedItem.value.priority === 'object') ? editedItem.value.priority.id : editedItem.value.priority
    return priorities.value[index].description
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

// checks for the 2 business days rule
function dateValidation(input) {
  if(input) {
    // get day of week
    let selectedDateDay = new Date(input).getDay()

    // get the current date plus 2 days, the convert to ISO format
    let date = new Date();
    let twoDaysFromNow = date.setDate(date.getDate() + 2);
    twoDaysFromNow = new Date(twoDaysFromNow).toISOString();

    // convert to local time
    let twoDaysFromNowLocaleString = new Date(twoDaysFromNow).toLocaleDateString()
    let twoDaysFromNowDateObj = new Date(twoDaysFromNowLocaleString)

    // convert to yyyy-mm-dd to match format of calendar input
    let twoDaysFromNowFormatted = convertToYyyymmddFormat(twoDaysFromNowDateObj)

    // logic to determine if selected date is valid
    if(selectedDateDay !== 5 && selectedDateDay !== 6) {
      if(input >= twoDaysFromNowFormatted) {
        return true
      } else {
        return false
      }
    }
  } else {
    return true
  }
}

function convertToYyyymmddFormat(value) {
  return value.getFullYear() 
    + "-" 
    + ((value.getMonth()+1).toString().length != 2 ? "0" + (value.getMonth() + 1) : (value.getMonth()+1)) 
    + "-" 
    + (value.getDate().toString().length != 2 ? "0" + value.getDate() : value.getDate());
}

onBeforeMount(async () => {
  loadTags()
  loadPersons()
  loadProjects()
  loadStatuses()
  loadPriorities()
})

onMounted(async () => {
  await loadItem()
})

async function loadItem() {
  if (props.recordId) {
    try {
      const response = await axios.get(`${runtimeConfig.public.API_URL}/workorder/` + props.recordId)
        console.log(response.data.data[0])
        loading.value = true
        editedItem.value = Object.assign({}, response.data.data[0])
        editedItem.value.time_estimate = minutesToHours(response.data.data[0].time_estimate)

        // for arrays
        if(editedItem.value.tags) {
          let tagsTemp = []
          editedItem.value.tags.forEach((tag) => {
            tagsTemp.push(tag.id)
          })
          editedItem.value.tags = tagsTemp
        }

        if(editedItem.value.assignees) {
          let assigneesTemp = []
          editedItem.value.assignees.forEach((assignee) => {
            assigneesTemp.push(assignee.id)
          })
          editedItem.value.assignees = assigneesTemp
        }

        if(editedItem.value.watchers) {
          let watchersTemp = []
          editedItem.value.watchers.forEach((watcher) => {
            watchersTemp.push(watcher.id)
          })
          editedItem.value.watchers = watchersTemp
        }

        // for objects
        editedItem.value.status = editedItem.value.status.id

        loadProjects()
        loadSubtasks(editedItem.value.project.id)
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

function loadTags() {
  axios.get(`${runtimeConfig.public.API_URL}/tags`)
  .then((response) => {
    tags.value = response.data.data.map((item) => {
      return {
        title: item.name,
        value: item.id
      }
    })

    // sort tags list
    tags.value = tags.value.sort((a, b) => 
      a.title.localeCompare(b.title))
  })
  .catch(err => console.log(err))
}

function loadPersons() {
  axios.get(`${runtimeConfig.public.API_URL}/persons`)
  .then((response) => {
    persons.value = response.data.data.map((item) => {
      return {
        title: item.name,
        // value: {color: item.color, email: item.email, id: item.id, initials: item.initials}
        value: item.id
      }
    })

    // sort persons list
    persons.value = persons.value.sort((a, b) => 
      a.title.localeCompare(b.title))
  })
  .catch(err => console.log(err))
}

function loadProjects() {
  // load project options
  axios.get(`${runtimeConfig.public.API_URL}/projects`)
  .then((response) => {
    projects.value = response.data.data.map((item) => {
      return {
        id: item.id,
        name: item.name
      }
    })
  })
  .catch(err => console.log(err))
}

function loadSubtasks(projectId) {
  // load subtask options
  axios.get(`${runtimeConfig.public.API_URL}/project/` + projectId + `/subtasks`)
  .then((response) => {
    subtasks.value = response.data.data.map((item) => {
      return {
        id: item.id,
        name: item.name
      }
    })
  })
  .catch(err => console.log(err))
}

function resetAndReloadSubtasks() {
  editedItem.value.subtask = ''
  subtasks.value = ''
  loadSubtasks(editedItem.value.project)
}

function loadStatuses() {
  axios.get(`${runtimeConfig.public.API_URL}/statuses`)
  .then((response) => {
    statuses.value = response.data.data.map((item) => {
      return {
        title: capitalizeFirstLetter(item.name),
        id: item.id
      }
    })
  })
  .catch(err => console.log(err))
}

function loadPriorities() {
  axios.get(`${runtimeConfig.public.API_URL}/priorities`)
  .then((response) => {
    priorities.value = response.data.data.map((item) => {
      return {
        title: capitalizeFirstLetter(item.name),
        id: item.id,
        description: item.description,
      }
    })
  })
  .catch(err => console.log(err))
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

  /* 
    TODO: TEST TO SEE IF WE CAN DELETE THIS
    Verified with create and read..  need to check with update  
    since API needs IDs of assignees, pull the assignee(s) ID(s) and store in temp array

  let assigneeids = []

  if(data.assignees) {
    data.assignees.forEach(element => {
      assigneeids.push(element)
    })
    data.assignees = assigneeids
  }
  */
  
  // hack warning: since API only accepts "priorityid" to set priority, but fetched data contains a "priority" object.
  if(data.priority) {
    if(data.priority.id) {
      data.priorityid = data.priority.id
    } else {
      data.priorityid = data.priority
    }
  }

  if(data.time_estimate) data.time_estimate = hoursToMinutes(data.time_estimate)

  if (!props.recordId) {
    data.creatorid = props.userInfo.id
    method = 'post'
    url = `${runtimeConfig.public.API_URL}/subtask/` + data.subtask + `/workorder`
  } else {
    method = 'put'
    url = `${runtimeConfig.public.API_URL}/workorder/` + data.id
  }

  console.log(data)
  
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

<style scoped>
  .modal-form {
    height: 80vh;
  }
</style>