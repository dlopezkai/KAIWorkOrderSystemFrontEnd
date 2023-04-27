<template>
    <div>
        <header>
            <nav>
                <v-toolbar flat app>
                    <v-toolbar-title>
                        <NuxtLink class="text-decoration-none black--text" to="/">ClickUp Integration App</NuxtLink>
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn to="/newWorkOrder" nuxt>Add new work order</v-btn>
                    <AuthN></AuthN>
                </v-toolbar>
            </nav>
        </header>
        <div>
            <slot />
        </div>
    </div>
</template>

<style scoped>
    a {
        color: #000000;
    }
    .router-link-exact-active {
        color: #000000;
    }
</style>