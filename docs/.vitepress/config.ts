import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'deploygate',
  description: 'Deployment lifecycle manager for hosting platforms',
  base: '/deploygate/',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API', link: '/api/deployment' },
      { text: 'Hooks', link: '/hooks/overview' },
      { text: 'Example', link: '/example/platform-integration' },
      { text: 'npm', link: 'https://npmjs.com/package/deploygate' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'State store', link: '/guide/state-store' }
          ]d
        }
      ],
      '/api/': [
        {
          text: 'API reference',
          items: [
            { text: 'Deployment', link: '/api/deployment' },
            { text: 'Slots', link: '/api/slots' },
            { text: 'Promote & rollback', link: '/api/promote' },
            { text: 'Domains', link: '/api/domains' }
          ]
        }
      ],
      '/hooks/': [
        {
          text: 'Hooks',
          items: [
            { text: 'Overview', link: '/hooks/overview' },
            { text: 'Lifecycle reference', link: '/hooks/lifecycle' },
            { text: 'Custom events', link: '/hooks/custom-events' }
          ]
        }
      ],
      '/example/': [
        {
          text: 'Example',
          items: [
            { text: 'Platform integration', link: '/example/platform-integration' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Emmanuelmelvin/deploygate' }
    ],
    footer: {
      message: 'Released under the MIT License.'
    }
  }
})
