#!/usr/bin/env node
import { main } from './cli/index'

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
