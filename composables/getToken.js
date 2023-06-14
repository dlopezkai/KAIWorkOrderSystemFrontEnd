export const getToken = async (command) => {
    function combine(...paths) {

        return paths
            .map(path => path.replace(/^[\\|/]/, "").replace(/[\\|/]$/, ""))
            .join("/")
            .replace(/\\/g, "/");
    }

    const { $msal } = useNuxtApp()

    let accessToken = "";
    let authParams = null;

    switch (command.type) {
        case "SharePoint":
        case "SharePoint_SelfIssued":
            authParams = { scopes: [`${combine(command.resource, ".default")}`] };
            break;
        default:
            break;
    }

    try {

        // see if we have already the idtoken saved
        const resp = await $msal.acquireTokenSilent(authParams);
        console.log(resp)
        accessToken = resp.accessToken;

    } catch (e) {
        console.log("error")
        console.log(e)
        // per examples we fall back to popup
        const resp = await $msal.loginPopup(authParams);
        $msal.setActiveAccount(resp.account);

        if (resp.idToken) {

            const resp2 = await $msal.acquireTokenSilent(authParams);
            accessToken = resp2.accessToken;

        }
    }

    return accessToken;
}