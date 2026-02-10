
import localCache from "~/utils/system/local-cache"
import liuEnv from "~/utils/thus-env"

interface AiReqOptions {
  timeout?: number
  signal?: AbortSignal
}

interface AiAutoTagResponse {
  tags: string[]
  threadId: string | null
}

interface AiSimilarItem {
  _id: string
  title?: string
  firstText?: string
  tags?: string[]
}

interface AiSimilarResponse {
  similar: AiSimilarItem[]
}

interface AiSummarizeResponse {
  summary: string
  originalLength: number
  summaryLength: number
}

interface AiSettingsResponse {
  aiEnabled: boolean
  aiTagCount: number
  aiTagStyle: 'concise' | 'detailed'
  aiFavoriteTags: string[]
  aiAutoTagMode: 'manual' | 'silent'
}

function _getBaseUrl(): string {
  const env = liuEnv.getEnv()
  const d = env.API_DOMAIN ?? ""
  return d.endsWith("/") ? d : d + "/"
}

function _getHeaders(): Record<string, string> {
  const p = localCache.getPreference()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if(p.token) {
    headers["x-liu-token"] = p.token
  }
  if(p.serial) {
    headers["x-liu-serial"] = p.serial
  }
  return headers
}

async function _request<T>(
  path: string,
  body: Record<string, unknown>,
  opt?: AiReqOptions,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const url = _getBaseUrl() + path
  const init: RequestInit = {
    method: "POST",
    headers: _getHeaders(),
    body: JSON.stringify(body),
  }

  if(opt?.signal) {
    init.signal = opt.signal
  }
  else if(typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
    init.signal = AbortSignal.timeout(opt?.timeout ?? 30000)
  }

  try {
    const res = await fetch(url, init)
    if(!res.ok) {
      const text = await res.text().catch(() => "")
      return { ok: false, error: `HTTP ${res.status}: ${text}` }
    }
    const json = await res.json()
    // 后端返回 { code: "0000", data: { ... } }，提取内层 data
    const payload = json?.data ?? json
    return { ok: true, data: payload as T }
  }
  catch(err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { ok: false, error: msg }
  }
}

async function _put<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const url = _getBaseUrl() + path
  const init: RequestInit = {
    method: "PUT",
    headers: _getHeaders(),
    body: JSON.stringify(body),
  }

  try {
    const res = await fetch(url, init)
    if(!res.ok) {
      const text = await res.text().catch(() => "")
      return { ok: false, error: `HTTP ${res.status}: ${text}` }
    }
    const json = await res.json()
    const payload = json?.data ?? json
    return { ok: true, data: payload as T }
  }
  catch(err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { ok: false, error: msg }
  }
}

async function autoTag(
  content: string,
  existingTags?: string[],
  threadId?: string,
) {
  return _request<AiAutoTagResponse>("api/ai/auto-tag", {
    content,
    existingTags,
    threadId,
  })
}

async function similar(
  content: string,
  threadId?: string,
  limit?: number,
) {
  return _request<AiSimilarResponse>("api/ai/similar", {
    content,
    threadId,
    limit,
  })
}

async function summarize(
  content: string,
  maxLength?: number,
) {
  return _request<AiSummarizeResponse>("api/ai/summarize", {
    content,
    maxLength,
  })
}

async function updateAiSettings(data: Partial<AiSettingsResponse>) {
  return _put<AiSettingsResponse>("api/settings/ai", data as Record<string, unknown>)
}

async function getAiSettings(): Promise<{ ok: boolean; data?: AiSettingsResponse; error?: string }> {
  const url = _getBaseUrl() + "api/settings"
  const init: RequestInit = {
    method: "GET",
    headers: _getHeaders(),
  }
  try {
    const res = await fetch(url, init)
    if(!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const json = await res.json()
    const s = json?.data?.settings
    return { ok: true, data: {
      aiEnabled: s?.aiEnabled ?? false,
      aiTagCount: s?.aiTagCount ?? 5,
      aiTagStyle: s?.aiTagStyle ?? 'concise',
      aiFavoriteTags: s?.aiFavoriteTags ?? [],
      aiAutoTagMode: s?.aiAutoTagMode ?? 'manual',
    }}
  }
  catch(err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return { ok: false, error: msg }
  }
}

export type { AiAutoTagResponse, AiSimilarItem, AiSimilarResponse, AiSummarizeResponse }

export default {
  autoTag,
  similar,
  summarize,
  updateAiSettings,
  getAiSettings,
}
