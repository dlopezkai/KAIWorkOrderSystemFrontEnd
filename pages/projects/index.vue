<template>
  <v-dialog v-model="dialog" max-width="800px">
    <form-component-project form-action="new" @close="close()" @closeAndReload="closeAndReload()"></form-component-project>
  </v-dialog>
</template>

<script setup>
import { useCurrentUrlStore } from '~/store/currenturl'

const urlStore = useCurrentUrlStore()
const dialog = inject('dialog')
const modalFormType = inject('modalFormType')

// mounted life-cycle hook
onMounted(() => {
  // needed for menu bar logic
  urlStore.changeUrl(window.location.href)
})
</script>

<style lang="scss" scoped>

</style>