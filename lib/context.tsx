/**
 * Backward-compatible re-exports from the new provider architecture.
 * All logic has been moved to lib/providers/*.
 *
 * Prefer importing directly from '@/lib/providers/AppProvider' in new code.
 */
export { AppProvider, useAppContext } from '@/lib/providers/AppProvider'
