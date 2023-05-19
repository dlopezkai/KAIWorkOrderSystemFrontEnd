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
    </div>
</template>

<script setup>
import axios from 'axios'

const runtimeConfigs = useRuntimeConfig()

const props = defineProps({
    taskid: String
})
const { taskid } = toRefs(props);


const commentsData = ref()

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
</script>

<style scoped>
.wrap-text {
    -webkit-line-clamp: unset !important;
}
</style>