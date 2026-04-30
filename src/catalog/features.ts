import type { Feature } from '@core/catalog/feature'

export const officialFeatures: Feature[] = [
  {
    slug: 'pino-logging',
    name: 'Pino Logging',
    description: 'Add a basic Pino logging setup.',
    source: {
      type: 'github',
      repo: 'httpsgabv/knitto-templates',
      name: 'feature-pino',
      path: '/features/',
    },
    supports: ['nestjs'],
    requires: [],
    conflictsWith: [],
  },
]
