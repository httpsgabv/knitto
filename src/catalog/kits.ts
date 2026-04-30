import type { Kit } from '../core/catalog/kit'

export const officialKits: Kit[] = [
  {
    slug: 'nestjs',
    name: 'NestJS',
    source: {
      type: 'github',
      repo: 'httpsgabv/knitto-templates',
      name: 'nest-api',
      path: '/kits/',
    },
    description: 'A NestJS starter for building modular APIs.',
    compatibleFeatures: ['pino-logging'],
  },
]
