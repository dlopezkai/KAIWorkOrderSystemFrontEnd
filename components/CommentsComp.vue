<template>
    <modal-comp 
        v-model="showConfirmDeleteModal"
        type="warning"
        cardTitle="⚠️ WARNING ⚠️"
        cardText="Deleting this comment is not reversible. Please confirm if you would like to proceed."
        cancelBtnText="Cancel"
        confirmBtnText="Confirm"
        @close="hideConfirmDeleteModal"
        @confirm="deleteComment"
    >
    </modal-comp>

    <modal-comp 
      v-model="deleteStatusOverlay"
      type="formSubmit"
      :cardTitle="onDeleteMsg"
      :cardText="deleteInfo"
      confirmBtnText="OK"
      :submitStatus="deleteStatus"
      @confirm="resetDeleteStatus"
    >
    </modal-comp>
    <div>
        <v-list lines="two" style="width:100%;" class="overflow-y-auto">
            <v-list-item
                v-if="commentsData.length > 0"
                v-for="comment in commentsData"
                :key="comment.id"
            >
                <v-row>
                    <v-col>
                        <v-list-item-title><strong>{{ comment.author_name + ' (' + formatToMMDDYYYY(comment.post_date) + ')' }}</strong></v-list-item-title>
                    </v-col>
                    <v-col v-if="userInfoStore.userInfo.id === comment.authorid" align="right">
                        <v-btn density="compact" icon="mdi-trash-can-outline" variant="plain" title="Remove comment" @click="displayConfirmDeleteModal(comment.id)"></v-btn>
                    </v-col>
                </v-row>
                <v-list-item-subtitle v-html="comment.message" class="comment-subtitle"></v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-else>No comments</v-list-item>
        </v-list>

        <v-divider v-if="!readonly" :thickness="3"></v-divider>

        <v-form v-if="!readonly" ref="form" @submit.prevent="submitComment" class="d-flex mt-2">
            <v-text-field v-model="commentForm.message" class="pr-5" placeholder="Enter a comment" outlined clearable></v-text-field>
            <v-btn :disabled="submitBtnDisabled" color="blue" class="mt-2" @click="submitComment" title="Submit comment">Submit</v-btn>
        </v-form>
    </div> 
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useUserInfoStore } from '~/store/userInfoStore'
import { formatToMMDDYYYY } from '~/helpers/datetimeConversions.js';

const runtimeConfig = useRuntimeConfig()
const userInfoStore = useUserInfoStore()
const commentsData = ref([])
const showConfirmDeleteModal = ref(false)
const deleteCommentId = ref('')
const deleteStatusOverlay = ref(false)
const deleteStatus = ref('')
const deleteInfo = ref('')

const props = defineProps({
    workorderid: String,
    readonly: Boolean,
})
const { workorderid } = toRefs(props);
const { readonly } = toRefs(props);

const commentForm = ref({
    authorid: userInfoStore.userInfo.id,
    author_name: '',
    message: '',
    post_date: '',
})

// computed value for comment delete progress messages
const onDeleteMsg = computed(() => {
  switch(deleteStatus.value) {
    case 'submitting':
      return 'Deleting. Please wait...'
    case 'internal_api_error':
      return 'There was an issue with the API.'
    case 'connection_failure':
      return 'There was an issue deleting your comment. Please try again.'
    case 'success':
      return 'Comment deleted successfully.'
    default:
      return ''
  }
})

// computed value for disabling / enabling comment submit button
const submitBtnDisabled = computed(() => {
    return (commentForm.value.message.length < 1) ? true : false
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
                authorid: item.author.id,
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
            commentForm.value.author_name = response.data.data.author.name
            commentForm.value.post_date = response.data.data.post_date
            commentForm.value.id = response.data.data.id
            commentsData.value.push(commentForm.value)

            // reset the form
            commentForm.value = {
                authorid: userInfoStore.userInfo.id,
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
    deleteInfo.value = ''
    deleteStatus.value = 'submitting'
    deleteStatusOverlay.value = true

    axios.delete(`${runtimeConfig.public.API_URL}/comment/` + deleteCommentId.value, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(function (response){
            if(response.status === 200) {
                if (response.data.response_code === 200) {
                    deleteStatus.value = 'success'

                    // perform logic to live-delete comment
                    commentsData.value = commentsData.value.filter(item => item.id !== deleteCommentId.value)
                } else {
                    deleteStatus.value = 'internal_api_error'
                    console.log(response)
                }
            }
        })
        .catch(function (error) {
            deleteStatus.value = 'connection_failure'
            deleteInfo.value = error
            console.log(error)
        })

        showConfirmDeleteModal.value = false
}


function resetDeleteStatus() {
  deleteStatus.value = ''
  deleteStatusOverlay.value = false
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