const BASE = import.meta.env.VITE_PUBLIC_ASSETS_URL as string | undefined

export function assetUrl(path: string): string {
  if (!BASE) return path
  return `${BASE}/${path.replace(/^\//, '')}`
}
