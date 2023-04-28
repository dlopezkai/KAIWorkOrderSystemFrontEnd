export const signIn = async () => {
    const { $msal } = useNuxtApp()
    const loginRequest = {
        scopes: ['openid', 'profile'],
    }
    try {
        await $msal.loginRedirect(loginRequest)
    } catch (err) {
        console.error('MSAL err: ' , err)
    }
}