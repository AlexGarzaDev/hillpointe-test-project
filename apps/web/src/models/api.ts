export interface VersionResponse {
  name?: string
  version?: string
}

export interface ApiStatus {
  name: string
  version: string
  isLoading: boolean
  error: string
}

const configuredApiBase = import.meta.env.VITE_API_URL?.trim()
const defaultApiBase = '/api'

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const base = (configuredApiBase && configuredApiBase.length > 0
    ? configuredApiBase
    : defaultApiBase).replace(/\/$/, '')

  return `${base}${normalizedPath}`
}
