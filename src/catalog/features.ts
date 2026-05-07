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
  {
    slug: 'sentry-nest',
    name: 'Sentry (NestJS)',
    description: 'Add a basic Sentry setup for NestJS.',
    source: {
      type: 'github',
      repo: 'httpsgabv/knitto-templates',
      name: 'sentry-nest',
      path: '/features/',
    },
    supports: ['nestjs'],
    requires: [],
    conflictsWith: [],
  },
  {
    slug: 'scalar-nest',
    name: 'Scalar (NestJS)',
    description: 'Add a basic Scalar OpenAPI setup.',
    source: {
      type: 'github',
      repo: 'httpsgabv/knitto-templates',
      name: 'scalar-nest',
      path: '/features/',
    },
    supports: ['nestjs'],
    requires: [],
    conflictsWith: [],
  },
  {
    slug: 'helmet-nest',
    name: 'Helmet (NestJS)',
    description: 'Add a basic Helmet setup.',
    source: {
      type: 'github',
      repo: 'httpsgabv/knitto-templates',
      name: 'helmet-nest',
      path: '/features/',
    },
    supports: ['nestjs'],
    requires: [],
    conflictsWith: [],
  },
  {
    slug: 'throttler-nest',
    name: 'Throttler (NestJS)',
    description: 'Add a basic throttler setup.',
    source: {
      type: 'github',
      repo: 'httpsgabv/knitto-templates',
      name: 'throttler-nest',
      path: '/features/',
    },
    supports: ['nestjs'],
    requires: [],
    conflictsWith: [],
  },
]
