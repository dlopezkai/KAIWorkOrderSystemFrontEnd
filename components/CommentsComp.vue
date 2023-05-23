<template>
    <div>
        <p>{{ comments.data.data }}</p>

        <v-list lines="two">
            <v-list-item
                v-for="comment in comments.data.data"
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

const { data: comments } = await useAsyncData('comments', () => {
    return $fetch(`/api/comments?taskid=${taskid.value}`, {
        method: 'get',
    })
})

function sendComment() {
    const data = {
        comment_text: commentForm.value[0].comment, 
        assignee: 72138402, 
        notify_all: false
    }

    axios.post(`${runtimeConfigs.public.API_URL}/task/` + taskid.value + `/comment`, data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
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