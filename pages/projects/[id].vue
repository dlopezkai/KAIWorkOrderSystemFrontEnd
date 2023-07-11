<template>
  <div>
    <form-component-project form-action="edit" @close="close()" @closeAndReload="closeAndReload()"></form-component-project>
  </div>
</template>

<script setup>
import { useCurrentUrlStore } from '~/store/currenturl'

const urlStore = useCurrentUrlStore()

// set urlStore url AND type
urlStore.changeUrl(window.location.href, 'edit')

</script>

<style lang="scss" scoped>

</style>