<template>
    <!-- <v-card v-if="authStore.loggedIn">
      <v-layout>
        <v-app-bar title="ClickUp Integration App">
            <AuthN></AuthN>
        </v-app-bar>
  
        <v-main style="min-height: 300px;">
            <div>
                <slot />
            </div>
        </v-main>
      </v-layout>
    </v-card>

    <v-card v-else>
    <v-card>
      <v-layout>
        <v-app-bar title="ClickUp Integration App">
            <AuthN></AuthN>
        </v-app-bar>
          
        <v-main style="min-height: 300px;">
            <div>
                <slot />
            </div>
        </v-main>
      </v-layout>
    </v-card> -->

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