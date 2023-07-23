<template>
    <div>
        <v-list lines="two" style="width:100vw;" class="overflow-y-auto">
            <v-list-item
                v-if="commentsData.length > 0"
                v-for="comment in commentsData"
                :key="comment.id"
            >
                <v-list-item-title><strong>{{ comment.username + ' (' + comment.post_date + ')' }}</strong></v-list-item-title>
                <v-list-item-subtitle v-html="comment.message" class="comment-subtitle"></v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-else>No comments</v-list-item>
        </v-list>

        <v-divider :thickness="3"></v-divider>

        <v-form ref="form" @submit.prevent="submitComment">
            <v-row class="pl-3 pr-3">
                <v-col cols="12" sm="12" md="12">
                    <v-text-field v-model="commentForm.message" class="pt-5" placeholder="Enter a comment" outlined clearable></v-text-field>
                </v-col>
            </v-row>
            <v-row class="pb-5">
                <v-col cols="12" sm="12" md="12" class="text-center">
                    <v-btn color="blue" class="rounded" @click="submitComment" title="Submit comment">Submit</v-btn>
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
    workorderid: String,
    userInfo: Object
})
const { workorderid } = toRefs(props);
const { userInfo } = toRefs(props)

const commentForm = ref({
    assignee: userInfo.value.id,
    message: '',
    notify_all: false,
    username: ''
})

onMounted(() => {
  loadComments()
})

function loadComments() {
    axios.get(`${runtimeConfig.public.API_URL}/workorder/` + workorderid.value + `/comments`)
    .then((response) => {
        commentsData.value = response.data.data.map((item) => {
            return {
                message: item.message,
                post_date: item.post_date,
                id: item.id,
                // username: item.user.username, // need user info here
            }
        })
    })
    .catch(err => console.log(err))
}

function submitComment() {
    if(commentForm.value.message != "") {
        const data = {
            message: commentForm.value.message, 
            assignee: commentForm.value.assignee, 
            notify_all: commentForm.value.notify_all,
        }

        axios.post(`${runtimeConfig.public.API_URL}/workorder/` + workorderid.value + `/comment`, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(function (response){
            // the next 4 commands are here to simulate a "live-update", and avoid an additional API GET request
            // actual data from clickup will be rendered in the list when user closes and reopens the modal
            commentForm.value.username = userInfo.value.username
            commentForm.value.assignee = userInfo.value.id
            commentForm.value.post_date = response.data.data.post_date

            commentsData.value.push(commentForm.value)

            // reset the form
            commentForm.value = {
                assignee: userInfo.value.id,
                message: '',
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

@media (max-width: 1279px) {
    .comment-subtitle {
        width: 90%;
    }
}

@media (min-width: 1280px) {
    .comment-subtitle {
        width: 75%;
    }
}
</style>