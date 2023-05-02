<template>
    <v-card v-if="authStore.loggedIn">
      <v-layout>
        <v-app-bar title="ClickUp Integration App">
            <!-- <v-btn to="/newWorkOrder" nuxt>Add new work order</v-btn> -->
            <AuthN></AuthN>
        </v-app-bar>
        
        <v-navigation-drawer>
          <v-list>
            <v-list-item to="/newWorkOrder" nuxt title="My work orders"></v-list-item>
            <v-list-item to="/" title="All work orders"></v-list-item>
          </v-list>
        </v-navigation-drawer>
  
        <v-main style="min-height: 300px;">
            <div>
                <slot />
            </div>
        </v-main>
      </v-layout>
    </v-card>

    <v-card v-else>
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