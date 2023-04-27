<template>
  <div class="d-flex align-center flex-column">
    <!-- <AuthN></AuthN> -->
    <!-- <p>{{ currentUser.name }}</p> -->
    <v-icon>mdi-home</v-icon>
    <v-card width="400">
      <v-card-title>This is a title</v-card-title>
      <v-card-subtitle>This is a subtitle</v-card-subtitle>
      <v-card-text> This is content </v-card-text>
    </v-card>
    <v-btn class="mt-10">Hello Sass Changes</v-btn>
  </div>
</template>

<script setup lang="ts">
//   import { useAuthStore } from '~/store/auth';
//   import { storeToRefs } from 'pinia'

//   const authStore = useAuthStore()
//   const { currentUser } = storeToRefs(authStore)
</script>

<style scoped>

</style>