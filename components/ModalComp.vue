<template>
    <v-overlay class="align-center justify-center" persistent>
        <v-container style="height: 400px;">
            <v-row class="fill-height" align-content="center" justify="center">
                <v-col class="text-subtitle-1 text-center" cols="12">
                    <v-card v-if="props.type === 'warning'" style="font-family:'Open Sans;'">
                        <v-card-title style="background-color:red; color:white">{{ props.cardTitle }}</v-card-title>
                        <v-spacer></v-spacer>
                        <v-card-text>{{ props.cardText }}</v-card-text>
                        <v-card-actions>
                            <v-row>
                                <v-col class="text-right">
                                    <v-btn variant="plain" class="rounded" @click="emit('close')" :title=props.cancelBtnText>{{ props.cancelBtnText }}</v-btn>
                                    <v-btn class="rounded" color="error" :title=props.confirmBtnText @click="emit('confirm')">{{ props.confirmBtnText }}</v-btn>
                                </v-col>
                            </v-row>
                        </v-card-actions>
                    </v-card>

                    <v-card v-if="props.type === 'formSubmit'" style="font-family:'Open Sans;'">
                        <v-card-title>{{ props.cardTitle }}</v-card-title>

                        <v-card-text v-if="props.cardText">
                            {{ props.cardText }}
                            <v-btn v-if="props.displayShareBtn" size="x-small" class="ml-2" variant="tonal" color="#428086" @click="emit('copyShareLink')">{{ props.shareBtnText }}</v-btn>
                        </v-card-text>

                        <v-progress-circular v-if="props.submitStatus === 'submitting'" color="#92D5D5" indeterminate size="64" class="mb-4"></v-progress-circular>
                        <v-btn v-if="props.submitStatus != 'submitting'" color="blue-darken-1" variant="tonal" class="mb-4" size="small" @click="emit('confirm')">
                            {{ props.confirmBtnText }}
                        </v-btn>
                    </v-card>

                    <v-card v-if="props.type === 'form'" style="font-family:'Open Sans'; min-width: 500px;">
                        <v-card-title>{{ props.cardTitle }}</v-card-title>
                        <v-spacer></v-spacer>
                        <v-card-text>
                            <v-form ref="form" @submit.prevent="submit">
                                <v-row>
                                    <v-col v-for="field in fields" cols="12" sm="12" md="12">
                                        <v-text-field v-model="field.value" :label="field.name"></v-text-field>
                                    </v-col>
                                </v-row>
                            </v-form>
                        </v-card-text>
                        <v-card-actions>
                            <v-row>
                                <v-col class="text-right">
                                    <v-btn variant="plain" @click="emit('close')" :title=props.cancelBtnText>{{ (fields.length > 0) ? props.cancelBtnText : 'Close' }}</v-btn>
                                    <v-btn v-if="fields.length > 0" :disabled="showConfirmBtn" class="rounded" color="error" :title=props.confirmBtnText @click="emit('confirm', fields)">{{ props.confirmBtnText }}</v-btn>
                                </v-col>
                            </v-row>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-overlay>
</template>

<script setup>
const props = defineProps({
    type: String,
    cardTitle: String,
    cardText: String,
    cancelBtnText: String,
    confirmBtnText: String,
    submitStatus: String,
    fields: Object,
    displayShareBtn: Boolean,
    shareBtnText: String,
})

const { fields } = toRefs(props);

const emit = defineEmits(['close', 'confirm', 'copyShareLink'])
</script>

<style lang="scss" scoped>

</style>