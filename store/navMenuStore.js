/*
    This store is used to maintain what items are displayed in the <v-navigation> menu panel.

    Each index page will inject layouts/default.vue's isRecordPage boolean to determine what 
    links are updated to the store via the setMenuItems setter method.
*/

import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNavMenuStore = defineStore('navMenuStore', () => {
    const table = ref({
        name: ''
    })
    
    const menuItems = ref({
        navigationItemsGroup: '',
        settingsItemsGroup: '',
        filterItemsGroup: ''
    })

    const canAddNewRecord = ref(true)

    const setTableName = (tableName) => {
        table.value.name = tableName
    }

    const setMenuItems = (navigationItems, settingsItems, filterItems) => {
        menuItems.value.navigationItemsGroup = navigationItems
        menuItems.value.settingsItemsGroup = settingsItems
        menuItems.value.filterItemsGroup = filterItems
    }

    const setCanAddNewRecord = (value) => {
       canAddNewRecord.value = (!value) ? false : true
    }

    return {
        table,
        menuItems,
        canAddNewRecord,
        setTableName,
        setMenuItems,
        setCanAddNewRecord
    }
})