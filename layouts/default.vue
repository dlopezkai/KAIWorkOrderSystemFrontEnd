<template>
    <div>
        <header>
            <nav>
                <NuxtLink to="/">Home link</NuxtLink>
                <ul>
                    <li>
                        <NuxtLink to="/">Link1</NuxtLink>
                        <NuxtLink to="/">Link2</NuxtLink>
                    </li>
                </ul>
            </nav>
            <AuthN></AuthN>
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