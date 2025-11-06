/**
 * Utility functions for generating stable IDs
 */

let idCounter = 0;

/**
 * Generate a stable, unique ID for client-side use
 * This avoids hydration mismatches caused by Date.now() or Math.random()
 */
export function generateId(): string {
  return `id_${++idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a stable ID based on a prefix
 */
export function generateIdWithPrefix(prefix: string): string {
  return `${prefix}_${++idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}
