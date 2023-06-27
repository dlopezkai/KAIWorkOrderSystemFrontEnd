<template>
    <div>
        <!-- <p>{{ comments.data.data }}</p> -->

        <v-list lines="two" style="max-height: 500px" class="overflow-y-auto">
            <v-list-item
                v-for="comment in commentsData"
                :key="comment.id"
            >
                <v-list-item-title><strong>{{  comment.username + ' (' + convertToDate(comment.date, 'table') + ')' }}</strong></v-list-item-title>
                <v-list-item-subtitle v-html="comment.comment_text" class="comment-subtitle"></v-list-item-subtitle>
            </v-list-item>
        </v-list>

        <v-divider :thickness="3"></v-divider>

        <v-form ref="form" @submit.prevent="submitComment">
            <v-row>
                <v-col cols="12" sm="12" md="12">
                    <v-text-field v-model="commentForm.comment_text" class="mr-3 pt-5" placeholder="Comment" outlined clearable></v-text-field>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12" sm="12" md="12" class="text-center">
                    <v-btn color="blue" class="rounded" @click="submitComment">Submit</v-btn>
                </v-col>
            </v-row>
        </v-form>
    </div> 
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { convertToDate } from '~/helpers/datetimeConversions.js'

const runtimeConfig = useRuntimeConfig()
const commentsData = ref([])

const props = defineProps({
    taskid: String,
    clickUpUserInfo: Object
})
const { taskid } = toRefs(props);
const { clickUpUserInfo } = toRefs(props)

const commentForm = ref({
    assignee: clickUpUserInfo.value.id,
    comment_text: '',
    notify_all: false,
    username: ''
})

onMounted(() => {
  loadComments()
})

function loadComments() {
    axios.get(`${runtimeConfig.public.API_URL}/task/` + taskid.value + `/comments`)
    .then((response) => {
        commentsData.value = response.data.data.map((item) => {
            return {
                comment_text: item.comment_text,
                date: item.date,
                id: item.id,
                username: item.user.username,
            }
        })
    })
    .catch(err => console.log(err))
}

function submitComment() {
    if(commentForm.value.comment_text != "") {
        const data = {
            comment_text: commentForm.value.comment_text, 
            assignee: commentForm.value.assignee, 
            notify_all: commentForm.value.notify_all,
        }

        axios.post(`${runtimeConfig.public.API_URL}/task/` + taskid.value + `/comment`, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(function (response){
            // the next 4 commands are here to simulate a "live-update", and avoid an additional API GET request
            // actual data from clickup will be rendered in the list when user closes and reopens the modal
            commentForm.value.username = clickUpUserInfo.value.username
            commentForm.value.assignee = clickUpUserInfo.value.id
            commentForm.value.date = response.data.data.date

            commentsData.value.push(commentForm.value)

            // reset the form
            commentForm.value = {
                assignee: clickUpUserInfo.value.id,
                comment_text: '',
                notify_all: false,
                username: ''
            }
        })
        .catch(function (error) {
            console.log(error)
        })
    }
}

</script>

<style scoped>
.comment-subtitle {
    -webkit-line-clamp: unset !important;
    font-size: 1rem;
    opacity: 1;
    line-height: 1.2;
}
</style>