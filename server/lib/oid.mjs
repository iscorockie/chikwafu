/** Object ids: 24 hex chars, the shape the JSON ledger already used. */
import { randomUUID } from 'node:crypto'

export const oid = () => randomUUID().replace(/-/g, '').slice(0, 24)
