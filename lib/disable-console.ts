// Disable ALL console methods in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const noop = () => {}
  
  // 1. Hide ALL console methods
  console.log = noop
  console.error = noop
  console.warn = noop
  console.info = noop
  console.debug = noop
  console.trace = noop
  console.dir = noop
  console.dirxml = noop
  console.group = noop
  console.groupEnd = noop
  console.groupCollapsed = noop
  console.table = noop
  console.time = noop
  console.timeEnd = noop
  console.timeLog = noop
  console.count = noop
  console.countReset = noop
  console.assert = noop
  console.clear = noop
  console.profile = noop
  console.profileEnd = noop
  
  // 2. Hide error stack traces
  window.addEventListener('error', (e) => {
    e.preventDefault()
    return false
  })

  // 3. Hide unhandled rejections
  window.addEventListener('unhandledrejection', (e) => {
    e.preventDefault()
    return false
  })
}