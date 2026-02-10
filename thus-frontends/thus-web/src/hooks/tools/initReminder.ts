import { db } from "~/utils/db"
import time from "~/utils/basic/time"
import cui from "~/components/custom-ui"
import { showBasicTime } from "~/utils/thus-util/date-util"
import type { ContentLocalTable } from "~/types/types-table"

const CHECK_INTERVAL = 30 * time.SECOND
const STORAGE_KEY = "thus_notified_reminders"
const CLEANUP_INTERVAL = 7 * 24 * time.HOUR
const DEBUG = import.meta.env.DEV

let timerId: ReturnType<typeof setInterval> | null = null
const notifiedIds = loadNotifiedIds()

export function initReminder() {
  if(DEBUG) console.log("[Reminder] Initializing reminder system...")
  requestNotificationPermission()
  cleanupOldNotifications()
  startReminderLoop()
  if(DEBUG) console.log("[Reminder] Reminder system initialized")
}

function loadNotifiedIds(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return new Set()
    const data = JSON.parse(stored) as Record<string, number>
    const now = time.getTime()
    const validIds = Object.entries(data)
      .filter(([_, stamp]) => now - stamp < CLEANUP_INTERVAL)
      .map(([id]) => id)
    return new Set(validIds)
  } catch {
    return new Set()
  }
}

function saveNotifiedIds() {
  try {
    const now = time.getTime()
    const data: Record<string, number> = {}
    notifiedIds.forEach(id => {
      data[id] = now
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
  }
}

function cleanupOldNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    const data = JSON.parse(stored) as Record<string, number>
    const now = time.getTime()
    const cleaned: Record<string, number> = {}
    
    Object.entries(data).forEach(([id, stamp]) => {
      if (now - stamp < CLEANUP_INTERVAL) {
        cleaned[id] = stamp
      }
    })
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  } catch {
  }
}

function requestNotificationPermission() {
  if(typeof Notification === "undefined") {
    if(DEBUG) console.log("[Reminder] Browser does not support Notification API")
    return
  }
  if(DEBUG) console.log(`[Reminder] Notification permission: ${Notification.permission}`)
  if(Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      if(DEBUG) console.log(`[Reminder] Notification permission result: ${permission}`)
    })
  }
}

function startReminderLoop() {
  if(timerId) return
  checkDueReminders()
  timerId = setInterval(checkDueReminders, CHECK_INTERVAL)
}

async function checkDueReminders() {
  try {
    const now = time.getTime()
    if(DEBUG) console.log(`[Reminder] Checking due reminders at ${new Date(now).toLocaleString()}`)
    
    const items = await db.contents
      .where("remindStamp")
      .belowOrEqual(now)
      .filter(c => {
        if(c.oState !== "OK") return false
        if(!c.remindStamp) return false
        if(notifiedIds.has(c._id)) return false
        const diff = now - c.remindStamp
        return diff >= 0 && diff < 5 * time.MINUTE
      })
      .limit(20)
      .toArray()

    if(DEBUG) console.log(`[Reminder] Found ${items.length} due reminder(s)`)

    for(const item of items) {
      if(DEBUG) console.log(`[Reminder] Notifying: ${item._id}`, { remindStamp: item.remindStamp, title: item.title })
      notifiedIds.add(item._id)
      const info = extractReminderInfo(item)
      showInAppReminder(info)
      showBrowserNotification(info)
    }

    if (items.length > 0) {
      saveNotifiedIds()
    }
  }
  catch (err) {
    console.error("[Reminder] Error checking reminders:", err)
  }
}

interface ReminderInfo {
  title: string
  timeStr: string
  snippet: string
}

function extractReminderInfo(item: ContentLocalTable): ReminderInfo {
  const title = getItemTitle(item)

  const stamp = item.remindStamp ?? item.whenStamp ?? item.calendarStamp
  const timeStr = stamp ? showBasicTime(stamp) : ""

  let snippet = ""
  if(item.thusDesc && Array.isArray(item.thusDesc)) {
    for(const node of item.thusDesc) {
      if(node.type === "paragraph" && node.content) {
        for(const inline of node.content) {
          if(inline.type === "text" && inline.text) {
            snippet += inline.text
            if(snippet.length >= 80) break
          }
        }
      }
      if(snippet.length >= 80) break
    }
    if(snippet.length > 80) snippet = snippet.substring(0, 80) + "…"
  }

  return { title, timeStr, snippet }
}

function getItemTitle(item: { title?: string; thusDesc?: any }): string {
  if(item.title) return item.title
  if(item.thusDesc && Array.isArray(item.thusDesc)) {
    for(const node of item.thusDesc) {
      if(node.type === "paragraph" && node.content) {
        for(const inline of node.content) {
          if(inline.type === "text" && inline.text) {
            return inline.text.substring(0, 50)
          }
        }
      }
    }
  }
  return "提醒事项"
}

function showInAppReminder(info: ReminderInfo) {
  const parts = ["⏰"]
  if(info.timeStr) parts.push(`[${info.timeStr}]`)
  parts.push(info.title)
  if(info.snippet && info.snippet !== info.title) {
    parts.push(`— ${info.snippet}`)
  }
  cui.showSnackBar({ text: parts.join(" "), duration: 5000 })
}

function showBrowserNotification(info: ReminderInfo) {
  if(typeof Notification === "undefined") return
  if(Notification.permission !== "granted") return

  const bodyParts: string[] = []
  if(info.timeStr) bodyParts.push(info.timeStr)
  bodyParts.push(info.title)
  if(info.snippet && info.snippet !== info.title) {
    bodyParts.push(info.snippet)
  }

  try {
    new Notification("如是 · 提醒", {
      body: bodyParts.join("\n"),
      icon: "/favicon.svg",
    })
  }
  catch {
  }
}
