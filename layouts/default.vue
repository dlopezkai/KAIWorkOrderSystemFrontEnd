<template>
    <div>
        <header>
            <nav v-if="authStore.loggedIn">
                <v-toolbar flat app>
                    <v-toolbar-title>
                        <NuxtLink class="text-decoration-none black--text" to="/">ClickUp Integration App</NuxtLink>
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn to="/newWorkOrder" nuxt>Add new work order</v-btn>
                    <AuthN></AuthN>
                </v-toolbar>
            </nav>

            <nav v-else>
                <v-toolbar flat app>
                    <v-toolbar-title>
                        <NuxtLink class="text-decoration-none black--text" to="/">ClickUp Integration App</NuxtLink>
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <AuthN></AuthN>
                </v-toolbar>
            </nav>
        </header>
        <div>
            <slot />
        </div>
    </div>
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