import { isIosDevice } from './videoPlayerPlatform'

function createSlotQueue(getMax) {
  let active = 0
  const wait = []

  return function acquireSlot() {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (active < getMax()) {
          active += 1
          resolve(() => {
            active -= 1
            const next = wait.shift()
            if (next) next()
          })
          return
        }
        wait.push(tryAcquire)
      }
      tryAcquire()
    })
  }
}

/** Imzalı URL API isteklerini sınırla (sayfa başına 24 paralel istek yavaşlatır). */
export const acquireVideoUrlSlot = createSlotQueue(() => (isIosDevice() ? 3 : 6))

/** iOS Safari'de eşzamanlı <video> metadata yüklemelerini sınırla. */
export const acquireThumbnailVideoSlot = createSlotQueue(() => (isIosDevice() ? 2 : 5))

export async function runWithVideoUrlSlot(fn) {
  const release = await acquireVideoUrlSlot()
  try {
    return await fn()
  } finally {
    release()
  }
}

export async function runWithThumbnailVideoSlot(fn) {
  const release = await acquireThumbnailVideoSlot()
  try {
    return await fn()
  } finally {
    release()
  }
}
