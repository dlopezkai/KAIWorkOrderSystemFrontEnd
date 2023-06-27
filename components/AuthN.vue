<template>
    <div>
        <v-btn @click.stop="signInAction" v-if="!authStore.loggedIn">Sign In</v-btn>
        <span v-if="authStore.loggedIn">
            <v-btn prepend-icon="mdi-logout-variant" @click.stop="signOutAction" title="Sign out">Sign Out</v-btn>
        </span>
    </div>
</template>

<script setup lang="ts">
    import { useAuthStore } from '~/store/auth';
    const authStore = useAuthStore()
    const { $msal } = useNuxtApp()
    
    async function signInAction() {
        await signIn()
    }

    async function signOutAction() {
        try {
            await $msal.logoutRedirect({
                postLogoutRedirectUri: '/',
            })
        } catch (err) {
            alert(err)
        }
    }
</script>

<style scoped>

</style>