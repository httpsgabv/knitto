import type { Kit } from './kit'

export interface Catalog {
  listKits(): Kit[]
  getKit(slug: string): Kit
}
