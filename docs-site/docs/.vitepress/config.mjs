import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'CAP Upgrade Guide',
  description: 'Breaking changes, migration steps, and upgrade tooling for SAP CAP versions.',
  base: '/cap-upgrade-tooling/',

  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'How it Works',   link: '/how-it-works' },
      { text: 'Migration Tool', link: '/migration-tool' },
      { text: 'Admin Guide',    link: '/admin-list' },
      { text: 'Developer Guide',link: '/developer-list' },
    ],
    sidebar: [
      {
        text: 'Upgrade Tooling',
        items: [
          { text: 'How it Works',    link: '/how-it-works' },
          { text: 'Migration Tool',  link: '/migration-tool' },
          { text: 'Admin Guide',     link: '/admin-list' },
          { text: 'Developer Guide', link: '/developer-list' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/SAP/cloud-cap-samples' },
    ],
    footer: {
      message: 'CAP Comprehensive Upgrade Tooling',
      copyright: 'SAP SE',
    },
  },

  vite: {
    // Allow importing JSON from outside the docs root
    resolve: {},
  },
})
