export interface UaResult {
  /** e.g. "Chrome", "Mobile Safari", "Firefox" */
  browser: string | null
  /** major version only, e.g. "138" */
  browserVersion: string | null
  /** e.g. "Mac OS X", "Windows", "iOS", "Android" */
  os: string | null
  /** major version only, e.g. "10", "18" */
  osVersion: string | null
}

export function parseUserAgent(ua: string): UaResult
