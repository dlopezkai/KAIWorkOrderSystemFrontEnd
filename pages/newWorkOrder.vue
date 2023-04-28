<template>
    <div>
        <span>page for new work order</span>
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