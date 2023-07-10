<template>
  <div>
    <form-component-project form-action="edit" @close="close()" @closeAndReload="closeAndReload()"></form-component-project>
  </div>
</template>

<script setup>
import { useCurrentUrlStore } from '~/store/currenturl'

const route = useRoute()
console.log(route.params.id)

const urlStore = useCurrentUrlStore()

urlStore.changeUrl(window.location.href)

</script>

<style lang="scss" scoped>

</style>