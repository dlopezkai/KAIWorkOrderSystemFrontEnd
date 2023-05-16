<!-- test template for useFetch. maybe try implenting in later phase -->
<template>
    <div>
        <p>{{ workOrders?.data }}</p>
    </div>
</template>

<script setup>
const tasks = ref([])

const runtimeConfigs = useRuntimeConfig()

const { data: workOrders, pending } = useFetch(`/tasks`, { 
    onRequest({ request, options }) {
        options.headers = options.headers || {}
        options.baseURL = runtimeConfigs.public.API_URL
    },   
    onResponse({ request, response, options }) {
         console.log(response._data.data.tasks)
    }
 })


</script>
