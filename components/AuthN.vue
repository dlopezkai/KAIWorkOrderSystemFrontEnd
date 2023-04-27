<template>
    <div>
        <a v-if="!authStore.loggedIn" href="" @click.prevent="signInAction">Sign In</a>
        <span v-if="authStore.loggedIn">
            Welcome {{ authStore.currentUser.name }} <br />
            <a href="" @click.prevent="signOutAction">Sign Out</a>
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