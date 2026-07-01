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
