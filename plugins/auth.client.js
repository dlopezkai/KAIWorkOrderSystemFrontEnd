import * as msal from '@azure/msal-browser'
import { useAuthStore } from '~/store/auth'

export default defineNuxtPlugin(nuxtApp => {
    const authStore = useAuthStore()
    const msalConfig = {
        auth: {
            clientId: 'd5b221ff-ff8c-4e0e-8e4a-896c22726147',
            authority: 'https://login.microsoftonline.com/301cd190-dea8-43b2-be10-137e0bf35332',
            redirectUrl: '/'
        }
    }
    const msalInstance = new msal.PublicClientApplication(msalConfig)
    const account = msalInstance.getActiveAccount()
    if (account != null) authStore.updateCurrentUser(account)

    msalInstance
    .handleRedirectPromise()
    .then((response) => {
        if (response) {
            const accounts = msalInstance.getAllAccounts()
            if (accounts.length > 0) {
                msalInstance.setActiveAccount(accounts[0])
                authStore.updateCurrentUser(accounts[0])
            }
        }
    })
    .catch((error) => {
        console.error('Auth Plugin MSAL error: ', error)
    })
    return {
        provide: {
            msal: msalInstance
        }
    }
})