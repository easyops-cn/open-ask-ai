// @ts-check
/** @type {import("plain-blog").SiteConfig} */
export default {
  site: {
    title: 'Open Ask AI',
    description: 'Open Ask AI Client',
    favicon: 'assets/favicon.svg',
    url: 'https://open-ask-ai.js.org/',
  },
  locales: ['en'],
  toc: true,
  shiki: {
    // theme: "light-plus",
    themes: {
      light: 'light-plus',
      dark: 'dark-plus',
    },
  },
  components: {
    // Home: 'src/components/Home.jsx',
    Page: 'src/components/Page.jsx',
    Header: 'src/components/Header.jsx',
    Footer: 'src/components/Footer.jsx',
  },
  elementTransforms: {
    pre: 'cp-pre',
  },
  styles: ['src/global.css'],
  scripts: ['src/client/index.js'],
}
