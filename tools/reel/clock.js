// Injected into the reel page before any of its scripts (page.addInitScript).
// Until freeze() the page runs on real time; after it, time moves only when
// the renderer calls advanceTo(), so every frame is computed, not recorded:
// timers, requestAnimationFrame, performance.now/Date.now and CSS
// transitions/animations (paused and seeked through the Web Animations API).
;(() => {
  const real = {
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    setInterval: window.setInterval.bind(window),
    clearInterval: window.clearInterval.bind(window),
    raf: window.requestAnimationFrame.bind(window),
    caf: window.cancelAnimationFrame.bind(window),
    perfNow: performance.now.bind(performance),
    dateNow: Date.now,
    fetch: window.fetch.bind(window),
  }

  let frozen = false
  let now = 0
  let dateBase = 0
  let seq = 1e7
  const timers = new Map()
  const frames = new Map()
  const inFlight = new Set()
  /** Animation → virtual time its currentTime counts from. */
  const starts = new WeakMap()

  window.setTimeout = function (fn, ms, ...args) {
    if (!frozen) return real.setTimeout(fn, ms, ...args)
    const id = seq++
    timers.set(id, { at: now + Math.max(0, Number(ms) || 0), every: 0, fn, args })
    return id
  }
  window.setInterval = function (fn, ms, ...args) {
    if (!frozen) return real.setInterval(fn, ms, ...args)
    const id = seq++
    const every = Math.max(1, Number(ms) || 0)
    timers.set(id, { at: now + every, every, fn, args })
    return id
  }
  window.clearTimeout = function (id) {
    if (timers.has(id)) timers.delete(id)
    else real.clearTimeout(id)
  }
  window.clearInterval = function (id) {
    if (timers.has(id)) timers.delete(id)
    else real.clearInterval(id)
  }
  window.requestAnimationFrame = function (cb) {
    if (!frozen) return real.raf(cb)
    const id = seq++
    frames.set(id, cb)
    return id
  }
  window.cancelAnimationFrame = function (id) {
    if (frames.has(id)) frames.delete(id)
    else real.caf(id)
  }
  performance.now = () => (frozen ? now : real.perfNow())
  Date.now = () => (frozen ? dateBase + now : real.dateNow())

  // Every request is tracked, so a frame waits for data it triggered.
  window.fetch = function (...args) {
    const request = real.fetch(...args)
    inFlight.add(request)
    const done = () => inFlight.delete(request)
    request.then(done, done)
    return request
  }

  // No hot reload while rendering: editing a source file must not restart the page mid-take.
  window.WebSocket = class {
    constructor() {
      this.readyState = 3
    }
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  }

  const call = (fn, args) => {
    try {
      if (typeof fn === 'function') fn(...args)
    } catch (error) {
      console.error(error)
    }
  }

  function syncAnimations() {
    for (const animation of document.getAnimations()) {
      let start = starts.get(animation)
      if (start === undefined) {
        start = now
        starts.set(animation, start)
      }
      if (animation.playState !== 'paused') animation.pause()
      animation.currentTime = Math.max(0, now - start)
    }
  }

  window.__clock = {
    get now() {
      return now
    },
    get frozen() {
      return frozen
    },
    /** Switch to virtual time; animations already running keep their progress. */
    freeze() {
      if (frozen) return
      now = real.perfNow()
      dateBase = real.dateNow() - now
      for (const animation of document.getAnimations()) {
        starts.set(animation, now - (Number(animation.currentTime) || 0))
      }
      frozen = true
      syncAnimations()
    },
    /** Moves virtual time to `target` ms, firing due timers in order, then one animation frame. */
    async advanceTo(target) {
      if (!frozen) return
      for (;;) {
        let next = null
        for (const [id, timer] of timers) {
          if (timer.at <= target && (!next || timer.at < next[1].at)) next = [id, timer]
        }
        if (!next) break
        const [id, timer] = next
        now = Math.max(now, timer.at)
        if (timer.every) timer.at += timer.every
        else timers.delete(id)
        call(timer.fn, timer.args)
        await Promise.resolve()
      }
      now = Math.max(now, target)
      const callbacks = [...frames.values()]
      frames.clear()
      for (const cb of callbacks) call(cb, [now])
      await Promise.resolve()
    },
    syncAnimations,
    /** Resolves when no request is in flight. */
    async idle() {
      while (inFlight.size) await Promise.allSettled([...inFlight])
    },
    realFrame: () => new Promise((resolve) => real.raf(() => resolve())),
    realTimeout: (ms) => new Promise((resolve) => real.setTimeout(resolve, ms)),
  }
})()
