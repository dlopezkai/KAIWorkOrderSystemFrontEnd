<template>
    <div>
        <!-- <p>{{ comments.data.data }}</p> -->

        <v-list lines="two" style="max-height: 500px" class="overflow-y-auto">
            <v-list-item
                v-for="comment in commentsData"
                :key="comment.id"
                :title="comment.username + ' - ' + comment.date"
            >
                <v-list-item-subtitle v-html="comment.comment_text" class="wrap-text"></v-list-item-subtitle>
            </v-list-item>
        </v-list>

        <v-divider :thickness="3"></v-divider>

        <v-form ref="form" @submit.prevent="sendComment">
            <v-row>
                <v-col cols="12" sm="10" md="10">
                    <v-text-field v-model="commentForm.comment_text" class="mr-3 pt-5" placeholder="Comment" outlined clearable></v-text-field>
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

function sendComment() {
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
        console.log(response)
        
        // add additional form fields
        commentForm.value.username = clickUpUserInfo.value.username
        commentForm.value.assignee = clickUpUserInfo.value.id
        commentForm.value.date = response.data.data.date

        // add new form data to commentsData object to be rendered in component
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

</script>

<style scoped>
.wrap-text {
    -webkit-line-clamp: unset !important;
}
</style>