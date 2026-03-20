import { useRegisterSW } from 'virtual:pwa-register/vue';
import { watch } from 'vue';
import liuConsole from "~/utils/debug/thus-console";
import localCache from "~/utils/system/local-cache";
import time from "~/utils/basic/time";
import type { SimplePromise } from '~/utils/basic/type-tool';
import { useGlobalStateStore } from '../stores/useGlobalStateStore';
import cui from '~/components/custom-ui';
import { db } from '~/utils/db';

const SEC_10 = 10 * time.SECOND
const MIN_15 = 15 * time.MINUTE

let _updateSW: SimplePromise | undefined
let _swUrl: string | undefined
let _swRegistration: ServiceWorkerRegistration | undefined
const isDev = import.meta.env.DEV

function logSW(label: string, ...args: unknown[]) {
  if (!isDev) return
  console.debug(`[service-worker][dev] ${label}`, ...args)
}

// Reference: 
// https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html#handling-edge-cases
const _checkSW = async (r: ServiceWorkerRegistration) => {
  logSW("registration status", {
    installing: r.installing,
    waiting: r.waiting,
    active: r.active,
  })

  const swUrl = _swUrl
  if(!swUrl) return
  if (r.installing || !navigator) return

  if ("connection" in navigator) {
    if (!navigator.onLine) return
  }

  const { lastCheckSWStamp } = localCache.getOnceData()
  if (lastCheckSWStamp) {
    const isWithin = time.isWithinMillis(lastCheckSWStamp, SEC_10)
      if (isWithin) {
      logSW("skip check: too frequent")
      return
    }
  }
  localCache.setOnceData("lastCheckSWStamp", time.getTime())

  const resp = await fetch(swUrl, {
    cache: 'no-store',
    headers: {
      'cache': 'no-store',
      'cache-control': 'no-cache',
    },
  })

  if (resp?.status === 200) {
    if (isDev) console.time("[service-worker][dev] update")
    await r.update()
    if (isDev) console.timeEnd("[service-worker][dev] update")
  }
  else {
    logSW("failed to fetch worker asset", resp)
  }
}


export function initServiceWorker() {
  
  const onRegisteredSW = (
    swUrl: string, 
    r: ServiceWorkerRegistration | undefined,
  ) => {
    // the func will be called every time you open the page
    // as long as sw is registered successfully
    _swRegistration = r
    _swUrl = swUrl
    
    if(!r) return
    setTimeout(() => {
      _checkSW(r)
    }, time.SECOND)
    setInterval(() => {
      _checkSW(r)
    }, MIN_15)

    r.addEventListener("updatefound", (evt) => {
      logSW("updatefound", evt)
      const newWorker = r.installing
      if(!newWorker) return
      logSW("worker state", newWorker.state)
      
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "activating") return
        logSW("worker state", newWorker.state)
      })
    })
  }

  const onRegisterError = (err: any) => {
    console.warn("onRegisterError err:")
    console.log(err)
    liuConsole.addBreadcrumb({ 
      category: "pwa.sw",
      message: "onRegisterError",
      level: "error",
    })
    liuConsole.sendException(err)
  }

  const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW,
    onRegisterError,
  })

  _updateSW = updateServiceWorker

  const gStore = useGlobalStateStore()

  watch([offlineReady, needRefresh], ([newV1, newV2]) => {
    logSW("register flags", { offlineReady: newV1, needRefresh: newV2 })
    gStore.setNewVersion(newV2)
  })

  window.addEventListener('beforeunload', (event) => {
    if(needRefresh.value) {
      logSW("beforeunload triggers update")
      updateServiceWorker()
    }
  })
}

export async function toUpdateSW(
  loading = false
) {
  if(!_updateSW) return

  if(loading) {
    cui.showLoading({ title_key: "common.updating" })
    setTimeout(() => {
      cui.hideLoading()
    }, 3000)
  }
  
  localCache.setOnceData("lastInstallNewVersion", time.getTime())

  db.close()

  await _updateSW()
}

export function checkUpdateManually() {
  const r = _swRegistration
  if(!r) return false
  _checkSW(r)
}

export function getSWRegistration() {
  return _swRegistration
}
