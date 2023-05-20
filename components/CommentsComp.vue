<template>
    <div>
        <p>{{ commentsData }}</p>

        <v-list lines="two">
            <v-list-item
                v-for="comment in commentsData"
                :key="comment.id"
                :title="comment.user.username + ' - ' + comment.date"
            >
                <v-list-item-subtitle v-html="comment.comment_text" class="wrap-text"></v-list-item-subtitle>
            </v-list-item>
        </v-list>

        <v-divider :thickness="3"></v-divider>

        <v-form ref="form" @submit.prevent="sendComment">
            <v-row>
                <v-col cols="12" sm="10" md="10">
                    <v-text-field v-model="commentForm[0].comment" class="mr-3 pt-5" placeholder="Comment" outlined clearable></v-text-field>
                </v-col>
                <v-col cols="12" sm="2" md="2">
                    <v-btn dark x-large color="blue" class="mt-7" @click="sendComment">Submit</v-btn>
                </v-col>
            </v-row>
        </v-form>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const runtimeConfigs = useRuntimeConfig()

const props = defineProps({
    taskid: String
})
const { taskid } = toRefs(props);

// where get request sets data
const commentsData = ref()

// where form data gets set for post request
// TODO: set assignee to logged-in user
const commentForm = ref([
  {
    assignee: 72138402,
    comment: '',
    notify_all: false
  },
])

// default data - wire up later
const commentFormDefault = ref([
  {
    assignee: '',
    comment: '',
    notify_all: false
  },
])

onMounted(() => {
    fetchComments()
})

function fetchComments() {
    axios.get(`${runtimeConfigs.public.API_URL}/task/` + taskid.value + `/comments`)
    .then((response) => {
        commentsData.value = response.data.data.map((item) => {
            return {
                comment_text: item.comment_text,
                date: item.date,
                id: item.id,
                user: item.user,
            }
        })
    })
    .catch(err => console.log(err))
}

function sendComment() {
    // alert(JSON.stringify(commentForm.value, null, 2))
    axios.post(`${runtimeConfigs.public.API_URL}/task/` + taskid.value + `/comment`, {
        comment_text: commentForm.value[0].comment, 
        assignee: 72138402, 
        notify_all: false

    // JSON.stringify(commentForm.value, null, 2)
    })
    .then(function (response){
        console.log(response)
    })
    .catch(function (error) {
        console.log(error)
    })
}
</script>

<style scoped>
.wrap-text {
    -webkit-line-clamp: unset !important;
}
</style>