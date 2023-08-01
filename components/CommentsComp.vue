<template>
    <v-overlay v-model="showConfirmDeleteModal" class="align-center justify-center" persistent>
        <v-container style="height: 400px;">
            <v-row class="fill-height" align-content="center" justify="center">
                <v-col class="text-subtitle-1 text-center" cols="12">
                    <v-card style="font-family:'Open Sans;'">
                        <v-card-title style="background-color:red; color:white">⚠️ WARNING ⚠️</v-card-title>
                        <v-spacer></v-spacer>
                        <v-card-text>Deleting this comment is not reversible. Please confirm if you would like to proceed.</v-card-text>
                        <v-card-actions>
                            <v-row>
                                <v-col class="text-right">
                                    <v-btn variant="plain" @click="hideConfirmDeleteModal" title="Cancel">Cancel</v-btn>
                                    <v-btn class="rounded" color="error" @click="deleteComment">Confirm</v-btn>
                                </v-col>
                            </v-row>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-overlay>

    <div>
        <v-list lines="two" style="width:100%;" class="overflow-y-auto">
            <v-list-item
                v-if="commentsData.length > 0"
                v-for="comment in commentsData"
                :key="comment.id"
            >
                <v-row>
                    <v-col>
                        <v-list-item-title><strong>{{ comment.author_name + ' (' + comment.post_date + ')' }}</strong></v-list-item-title>
                    </v-col>
                    <!-- uncomment when DELETE endpoint is available -->
                    <!-- <v-col v-if="userInfoStore.userInfo.id === comment.author_id" align="right">
                        <v-btn density="compact" icon="mdi-trash-can-outline" variant="plain" title="Remove comment" @click="displayConfirmDeleteModal(comment.id)"></v-btn>
                    </v-col> -->
                </v-row>
                <v-list-item-subtitle v-html="comment.message" class="comment-subtitle"></v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-else>No comments</v-list-item>
        </v-list>

        <v-divider :thickness="3"></v-divider>

        <v-form ref="form" @submit.prevent="submitComment">
            <v-row>
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
import { useUserInfoStore } from '~/store/userInfoStore'

const runtimeConfig = useRuntimeConfig()
const userInfoStore = useUserInfoStore()
const commentsData = ref([])
const showConfirmDeleteModal = ref(false)
const deleteCommentId = ref('')

const props = defineProps({
    workorderid: String,
})
const { workorderid } = toRefs(props);

const commentForm = ref({
    authorid: userInfoStore.userInfo.id,
    author_name: '',
    message: '',
    post_date: '',
})

onMounted(() => {
  loadComments()
})

function loadComments() {
    axios.get(`${runtimeConfig.public.API_URL}/workorder/` + workorderid.value + `/comments`)
    .then((response) => {
        commentsData.value = response.data.data.map((item) => {
            return {
                id: item.id,
                author_id: item.author.id,
                author_name: item.author.name,
                message: item.message,
                post_date: item.post_date
            }
        })
    })
    .catch(err => console.log(err))
}

function submitComment() {
    if(commentForm.value.message != "") {
        const data = {
            authorid: commentForm.value.authorid, 
            message: commentForm.value.message, 
        }

        axios.post(`${runtimeConfig.public.API_URL}/workorder/` + workorderid.value + `/comment`, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(function (response){
            // the next set of commands are here to simulate a "live-update", and avoid an additional API GET request
            // actual data from clickup will be rendered in the list when user closes and reopens the modal
            
            // commentForm.value.author_name = userInfo.value.name
            
            // commentForm.value.author_name = response.data.data.author.name
            // commentForm.value.post_date = response.data.data.post_date

            commentForm.value.author_name = '{{ response_author_name }}'
            commentForm.value.post_date = '{{ response_author_date }}'
            
            commentsData.value.push(commentForm.value)

            // reset the form
            commentForm.value = {
                author_name: '',
                message: '',
                post_date: '',
            }
        })
        .catch(function (error) {
            console.log(error)
        })
    }
}

function deleteComment() {
    console.log(deleteCommentId.value)
    // integrate DELETE endpoint when ready...
}

function displayConfirmDeleteModal(commentId) {
    showConfirmDeleteModal.value = true
    deleteCommentId.value = commentId
}

function hideConfirmDeleteModal() {
    showConfirmDeleteModal.value = false
    deleteCommentId.value = ''
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

.v-list-item:nth-child(even) {
  background: #F8F8F8
}

.v-list-item:nth-child(odd) {
  background: #FFFFFF
}
</style>