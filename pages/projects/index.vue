<template>
  <v-container fluid>
    <!-- <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      label="Search (TBD)"
      single-line
      density="comfortable"
      hide-details
      disabled
    ></v-text-field> -->

    <!-- <div v-if="!clickUpUserInfo.length">
      <p>Please register for a KAI ClickUp account to use this application</p>
    </div> -->
    <!-- <div v-else>  -->
    <!-- to make row clickable again, add @click:row="(pointerEvent, {item}) => editItem(item.raw)" -->
    <v-data-table-server
      v-model:page="page"
      :headers="headers" 
      :items-length="totalItems"
      :items="data" 
      :loading="loading" 
      class="elevation-1 overflow-y-auto"
      style="max-height: 80vh"
      density="comfortable"
      :search="search"
      @update:options="loadItems"
    >
      <template v-slot:top>
        <v-dialog v-model="dialog" max-width="800px">
          <form-component-project form-action="new" @close="close()" @closeAndReload="closeAndReload()"></form-component-project>
        </v-dialog>
      </template>

      <template v-slot:item.actions="{ item }">
        <NuxtLink :to="'/projects/' + item.raw.id" title="Edit work order">
          <v-icon size="small" class="me-2">mdi-pencil</v-icon>
        </NuxtLink>
      </template>

      <template v-slot:bottom v-if="!showFooter"></template>
    </v-data-table-server>
  </v-container>
</template>

<script setup>
import { useCurrentUrlStore } from '~/store/currenturl'

const urlStore = useCurrentUrlStore()
const dialog = inject('dialog')
const modalFormType = inject('modalFormType')
const data = ref([])

const headers = [
  { title: 'Project', key: 'project', align: 'start', sortable: false },
  { title: 'Subtask', key: 'subtask', align: 'start', sortable: false },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
]

// mounted life-cycle hook
onMounted(() => {
  // needed for menu bar logic
  urlStore.changeUrl(window.location.href)
})

function close() {
  dialog.value = false
}

function loadItems() {
  data.value = [
    {
      id: 1,
      project: 'CMS 6',
      subtask: 'Common Tasks',
    },
    {
      id: 2,
      project: 'CMS 6',
      subtask: 'Task A',
    },
    {
      id: 3,
      project: 'CMS 6',
      subtask: 'Task B',
    },
    {
      id: 4,
      project: 'CMS 6',
      subtask: 'Task C',
    },
  ]
}
</script>

<style lang="scss" scoped>

</style>