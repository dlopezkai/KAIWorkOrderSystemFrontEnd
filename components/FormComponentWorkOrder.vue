<template>
  <div v-if="loading && props.formAction === 'edit'" class="pa-1">
    Retrieving data ...
  </div>

  <div v-else-if="!recordFound && props.formAction === 'edit'" class="pa-1">
    Invalid record ID
  </div>

  <div v-else class="pa-1">
    <modal-comp 
      v-model="submitStatusOverlay"
      type="formSubmit"
      :cardTitle="onSubmitMsg"
      :cardText="submitInfo"
      confirmBtnText="OK"
      :displayShareBtn=displayShareBtn
      shareBtnText="Copy URL"
      :submitStatus="submitStatus"
      @confirm="resetSubmitStatus"
      @copyShareLink="copyLink"
    >
    </modal-comp>

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
            <v-form ref="form" @submit.prevent="submit" :readonly="readonly">
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
                  <v-select v-model="editedItem.tags" label="Type" :items="tags" item-title="title" item-value="value" :rules="[rules.select]" multiple chips clearable></v-select>
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
                  <div v-if="!readonly" class="d-flex mb-2">
                    <v-text-field 
                      v-model="linkTemp" 
                      label="Add SharePoint Link(s)"
                      @keydown.enter="pushLink()"
                      @blur="pushLink()"
                      class="pr-5"
                    ></v-text-field>
                    <v-btn :href="sharePointBtnUrl" target="_blank" variant="tonal" class="rounded" color="#428086" title="Open SharePoint">Open SharePoint site</v-btn>
                  </div>
                    
                  <div class="d-flex mb-2">
                    <v-chip v-for="link in editedItem.links" :href=link target="_blank" :closable="!readonly" @click:close="deleteLink(link)">
                      <span class="wrapclass" style="width:250px"> {{ link }} </span>
                    </v-chip>
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-row>
              <v-col v-if="props.recordId" class="text-left">
                <v-btn variant="plain" class="rounded" @click="copyLink" title="Copy record link">{{ copyUrlBtnText }}</v-btn>
              </v-col>
              <v-col class="text-right">
                <v-btn variant="plain" class="rounded" @click="close" :title="`${ cancelBtnText }`">{{ cancelBtnText }}</v-btn>
                <v-btn v-if="!readonly" :disabled="submitBtnDisabled" class="rounded" color="blue" @click="submit" :title="`${ submitBtnText } work order`">{{ submitBtnText }}</v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-window-item>

      <v-window-item v-if="props.recordId" value="two">
        <v-card>
          <v-card-text>
            <comments-comp :workorderid="props.recordId" :readonly="readonly"></comments-comp>
          </v-card-text>
        </v-card>
        
      </v-window-item>
    </v-window>
    
  </div>
</template>

<script setup>
import axios from 'axios'
import { useAuthStore } from '~/store/auth';
import { useUserInfoStore } from '~/store/userInfoStore'
import CommentsComp from './CommentsComp.vue';
import { capitalizeFirstLetter } from '~/helpers/capitalizeFirstLetter.js';
import '~/assets/css/main.css'

const loading = ref(true)
const runtimeConfig = useRuntimeConfig()
const authStore = useAuthStore()
const userInfoStore = useUserInfoStore()
const tags = ref([])
const persons = ref([])
const projects = ref([])
const subtasks = ref([])
const priorities = ref([])
const form = ref(null)
const formTab = ref(null)
const readonly = ref(false)
const recordFound = ref(true)
const submitBtnDisabled = ref(false)
const submitStatusOverlay = ref(false)
const submitStatus = ref('')
const submitInfo = ref('')
const urlCopied = ref(false)
const displayShareBtn = ref(false)
const shareUrl = ref('')
const linkTemp = ref('')
const props = defineProps({
    recordId: String,
    formAction: String,
    userInfo: Object,
    statuses: Array,
})

const editedItem = ref([
  {
    assignees: '',
    creator: '',
    description: '',
    due_date: '',
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

const emit = defineEmits(['close', 'closeAndReload'])

// form field validation rules
const rules =
{
  required: v => !!v || 'Field is required',
  length: v => v.length >= 3 || 'Minimum length is 3 characters',
  select: v => !!v || 'Select a valid option',
  due_date: v => !!v || 'Date must be selected',
  due_date_threshold: v => dateValidation(v) || 'Date must be 2 business days from today',
}

// computed value for form title
const formTitle = computed(() => {
  return (!props.recordId) ? 'New Work Order Form' : 
    (readonly.value) ? 'Archived Work Order Details' : 'Edit Work Order Form'
})

// computed value for save/submit button text
const submitBtnText = computed(() => {
  return (!props.recordId) ? 'Submit' : 'Save'
})

// computed value for close/cancel button text
const cancelBtnText = computed(() => {
  return (!props.recordId) ? 'Cancel' : 
    (readonly.value) ? 'Close' : 'Cancel'
})

// computed value for copy record link button text
const copyUrlBtnText = computed(() => {
  return (urlCopied.value) ? 'Record Link Copied' : 'Copy Record Link'
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

// computed value for Sharepoint link href
const sharePointBtnUrl = computed(() => {
  if (editedItem.value.project === null || editedItem.value.project === undefined) {
    return 'https://kauffmaninc.sharepoint.com/'
  } else {
    const index = (typeof editedItem.value.project === 'object') ? editedItem.value.project.id : editedItem.value.project
    const link = projects.value[index - 1].link

    // not sure why DB stores a string of "null" instead of keyword, but account of the string also...
    return (link === null || link === 'null' || link === undefined || link.length < 1 ) ? 'https://kauffmaninc.sharepoint.com/' : link
  }
})

// computed CSS class to control scrolling of the form
const scrollingClasses = computed(() => {
  if (props.formAction === 'new') {
    return 'overflow-y-auto modal-form'
  }
})


onBeforeMount(() => {
  loadTags()
  loadPersons()
  loadProjects()
  loadPriorities()
})

onMounted(async () => {
  await loadItem()

  // set form to readonly state if on a record page and WO project is archived
  if(props.recordId && editedItem.value.project.isarchived == 1) {
    readonly.value = true
  }
})


async function loadItem() {
  if (props.recordId) {
    try {
      const response = await axios.get(`${runtimeConfig.public.API_URL}/workorder/` + props.recordId)
        loading.value = true

        // if not record found, display invalid record message and cease loading page
        if(response.data.data == 0) {
          loading.value = false
          recordFound.value = false
          return
        }

        editedItem.value = Object.assign({}, response.data.data[0])

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

        // make an array of links. used to make individual clickable v-chips
        // delimiter is a comma - update later if this isn't acceptable
        if(editedItem.value.links && editedItem.value.links.length > 0) {
          const linksArray = editedItem.value.links.split(',');
          editedItem.value.links = linksArray
        }

        if (editedItem.value.project.isarchived === '1') {
          editedItem.value.project.name = editedItem.value.project.name + ' (' + editedItem.value.project.billing_code + ')'
        }

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
        title: item.name.toUpperCase(),
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
  axios.get(`${runtimeConfig.public.API_URL}/projects`)
  .then((response) => {
    const filteredResponse = response.data.data.filter(item => item.isarchived != 1)

    projects.value = filteredResponse.map((item) => {
      return {
        id: item.id,
        name: item.name + ' (' + item.billing_code + ')',
        link: item.link
      }
    })

    // sort projects list
    projects.value = projects.value.sort((a, b) => 
      a.name.localeCompare(b.name))
  })
  .catch(err => console.log(err))
}


function loadSubtasks(projectId) {
  axios.get(`${runtimeConfig.public.API_URL}/project/` + projectId + `/subtasks`)
  .then((response) => {
    subtasks.value = response.data.data.map((item) => {
      return {
        id: item.id,
        name: item.name
      }
    })

    // sort subtasks list
    subtasks.value = subtasks.value.sort((a, b) => 
      a.name.localeCompare(b.name))
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
  displayShareBtn.value = false
  let method = ''
  let url = ''

  // create a data object that will be passed to API to prevent user from seeing conversions
  let data = Object.assign({}, editedItem.value)

  // if subtask comes in as object, pull only the ID
  if ( typeof data.subtask === 'object' && data.subtask.id ) {
    data.subtask = data.subtask.id
  }

  /* 
    to clear-out assignees, watchers and/or tags while modifying a workorder, 
    the API requires a value of '0' to be sent over for that specific field.
  */
  if (props.recordId) {
    if (data.assignees && data.assignees.length === 0) {
      data.assignees = 0
    }

    if (data.watchers && data.watchers.length === 0) {
      data.watchers = 0
    }

    if (data.tags && data.tags.length === 0) {
      data.tags = 0
    }

    // PUT endpoint requires 'subtaskid', whereas POST requires 'subtask'
    data.subtaskid = data.subtask
    delete data.subtask

    // PUT endpoint requires 'statusid', but GET returns status as object
    data.statusid = data.status
    delete data.status
  }

  // hack warning: since API only accepts "priorityid" to set priority, but fetched data contains a "priority" object.
  if(data.priority) {
    if(data.priority.id) {
      data.priorityid = data.priority.id
    } else {
      data.priorityid = data.priority
    }
  }

  // transform links array back to a string since that's what DB is expecting
  if(data.links) {
    data.links = data.links.toString()
  }

  if (!props.recordId) {
    data.creatorid = userInfoStore.userInfo.id
    method = 'post'
    url = `${runtimeConfig.public.API_URL}/subtask/` + data.subtask + `/workorder`
  } else {
    method = 'put'
    url = `${runtimeConfig.public.API_URL}/workorder/` + data.id
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
          shareUrl.value = (!props.recordId) ? window.location.origin + '/workorders?id=' + response.data.data.id : ''
          submitInfo.value = (!props.recordId) ? 'Work order URL: ' + shareUrl.value : ''
          displayShareBtn.value = (!props.recordId) ? true : false
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


function resetAndReloadSubtasks() {
  editedItem.value.subtask = ''
  subtasks.value = ''
  loadSubtasks(editedItem.value.project)
}


function resetSubmitStatus() {
  close()

  submitStatus.value = ''
  submitStatusOverlay.value = false
  submitBtnDisabled.value = false
}


function close() {
  if(submitStatus.value === 'success') {
    emit('closeAndReload')
  } else {
    emit('close')
  }
}


function copyLink() {
  const url = (!props.recordId) ? shareUrl.value : window.location.href
  window.navigator.clipboard.writeText(url)
  urlCopied.value = true
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


// create a editedItem.value.links array if it doesn't already exist
// push each linkTemp.value string to editedItem.value.links array
function pushLink() {
  if(linkTemp.value.length > 0) {
    if (!editedItem.value.links) {
        editedItem.value.links = []
      }
      editedItem.value.links.push(linkTemp.value)
      linkTemp.value = ''
    }
  }

function deleteLink(link) {
  editedItem.value.links = editedItem.value.links.filter(e => e !== link)
}

</script>

<style scoped>
  .modal-form {
    height: 80vh;
  }

  .wrapclass {
    width: 250px;
    max-width: 99%;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 10px
  }
</style>

<style>
  .v-chip__close {
    position: absolute;
    right: 5%;
  }
</style>