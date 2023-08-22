# KAI Work Order System Front End 

## Project Description
This application provides the user interface for the revised Work Order System for KAI. Data is supplied via a backend [API service](http://workorderapi.kauffmaninc.com/v2). 

The user interface allows user to manage work orders, and for those with higher privledges, allows them to manage projects and users.

User management is handled via Microsoft Authentication Library (MSAL).

Technologies used for this app are:
- [Vue3](https://vuejs.org/)
- [Nuxt3](https://nuxt.com/)
- [Vuetify3](https://vuetifyjs.com/)

See below information on how to get this application started locally, and for information regarding current known issues.

## Nuxt 3 Minimal Starter

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

This app is using Vuetify with Nuxt3. Currently, there is a known [issue](https://github.com/nuxt/nuxt/issues/15412) where VS Code and browser dev tools console will spit out errors similar to: 

VSCode:
```bash
Sourcemap for "plugin-vuetify:components/VPagination/VPagination.sass" points to missing source files  
```

Browser console:
```bash
GET http://localhost:3000/_nuxt/%EF%BF%BDplugin-vuetify:components/VPagination/VPagination.sass net::ERR_ABORTED 404 (Page not found: /_nuxt/%EF%BF%BDplugin-vuetify:components/VPagination/VPagination.sass)
```

These errors do not have an impact on functionality of application.
