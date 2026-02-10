/**
 * Database client wrapper for Cloudflare D1
 */
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Create a Drizzle ORM client for D1 database
 *
 * @param d1 - Cloudflare D1Database binding
 * @returns Drizzle ORM client with schema
 */
export function createDbClient(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
