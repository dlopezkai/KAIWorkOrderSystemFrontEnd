<template>
  <div>
    <form-component-project form-action="edit" :record-id="route.params.id" @close="close()" @closeAndReload="closeAndReload()"></form-component-project>
  </div>
</template>

<script setup>
import { useCurrentUrlStore } from '~/store/currenturl'

const urlStore = useCurrentUrlStore()
const route = useRoute()

// set urlStore url AND type
urlStore.changeUrl(window.location.href, 'edit')

function close() {
  navigateTo('/')
}

</script>

<style lang="scss" scoped>

</style>