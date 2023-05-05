<template>
    <div>
        <span>TODO: refresh table to only display the logged-in user's work orders</span>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/store/auth';
    const authStore = useAuthStore()
    const { $msal } = useNuxtApp()
    onMounted(async () => {
        await $msal.handleRedirectPromise()
        if(!authStore.loggedIn) {
            await signIn()
        }
    })
</script>

<style lang="scss" scoped>

</style>