<template>
    <div>
        <p>Comment for {{ taskid }}</p>
        <p>{{ commentsData }}</p>
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
                username: item.user.username
            }
        })
    })
    .catch(err => console.log(err))
}
</script>

<style lang="scss" scoped>

</style>