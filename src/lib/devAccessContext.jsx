import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { verifyDevAccess } from './devAccess'

// Shared, app-wide "is the dev passphrase unlocked" flag — Navbar needs it to gray out
// the Professor Finder link, Footer needs it to know whether to show the passphrase
// prompt or the unlocked dev links. A single provider means one verify round-trip on
// load instead of each component independently polling the server, and lets Footer's
// unlock flow update Navbar immediately without a page reload.
const DevAccessContext = createContext({ unlocked: false, checked: false, setUnlocked: () => {} })

export function DevAccessProvider({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [checked, setChecked] = useState(false)

  const refresh = useCallback(() => {
    verifyDevAccess().then((ok) => {
      setUnlocked(ok)
      setChecked(true)
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <DevAccessContext.Provider value={{ unlocked, checked, setUnlocked }}>
      {children}
    </DevAccessContext.Provider>
  )
}

export function useDevAccess() {
  return useContext(DevAccessContext)
}
