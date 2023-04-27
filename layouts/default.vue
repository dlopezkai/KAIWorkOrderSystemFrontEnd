<template>
    <div>
        <header>
            <nav>
                <v-toolbar flat app>
                    <v-toolbar-title>
                        <span class="font-weight-light">ClickUp Integration App</span>
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <!-- equivalent to <NuxtLink to="/about">Link1</NuxtLink> -->
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
    .router-link-exact-active {
        color: #12b488;
    }
</style>