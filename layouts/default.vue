<template>
      <v-layout>
        <v-main style="min-height: 300px;">
            <div>
              <slot />
            </div>
        </v-main>
      </v-layout>

  </template>

<script setup lang="ts">
  import { useAuthStore } from '~/store/auth';
  // import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  // const { currentUser } = storeToRefs(authStore)
</script>

<style scoped>
    a {
        color: #000000;
    }
    .router-link-exact-active {
        color: #000000;
    }
</style>