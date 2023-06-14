# R&D CODE - DO NOT COMMIT
This is all test code to try and integrate OneDrive filepicker into the app. 

File picker documentation: https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/?view=odsp-graph-online

Note that Client ID in this branch is NOT the one we are using for production!

# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# yarn
yarn install

# npm
npm install

# pnpm
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Current issues

This app is using Vuetify with Nuxt3. Currently, there is a known issue where VS Code and browser dev tools console will spit out errors similar to: 

VSCode:
```bash
Sourcemap for "plugin-vuetify:components/VPagination/VPagination.sass" points to missing source files  
```

Browser console:
```bash
GET http://localhost:3000/_nuxt/%EF%BF%BDplugin-vuetify:components/VPagination/VPagination.sass net::ERR_ABORTED 404 (Page not found: /_nuxt/%EF%BF%BDplugin-vuetify:components/VPagination/VPagination.sass)
```

These errors do not have an impact on functionality of application.