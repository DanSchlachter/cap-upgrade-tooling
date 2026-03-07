import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
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

  mermaid: {
    // use default theme
  },

  vite: {
    optimizeDeps: {
      include: ['mermaid'],
    },
  },
}))
