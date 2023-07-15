/*
    This store is used to maintain what items are displayed in the <v-navigation> menu panel.
    Each index page will set/update the store by passing an array of menu items.
*/

import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNavMenuStore = defineStore('navMenuStore', () => {
    const menuItems = ref({
        navigationItems: '',
        filterItemsGroup: '',
        addRecordItems: ''
    })

    const setMenuItems = (navigationItems, filterItemsGroup, addRecordItems) => {
        menuItems.value.navigationItems = navigationItems
        menuItems.value.filterItemsGroup = filterItemsGroup
        menuItems.value.addRecordItems = addRecordItems
    }

    return {
        menuItems,
        setMenuItems
    }
})