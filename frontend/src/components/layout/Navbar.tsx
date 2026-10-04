import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { REGISTRATION_ENABLED } from '../../config/featureFlags'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getRoleLabel } from '../../utils/labels'

interface NavItemProps {
  end?: boolean
  label: string
  to: string
}

function NavItem({ end, label, to }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      data-text={label}
      className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
    >
      {label}
    </NavLink>
  )
}

const personIcon = (
  <svg viewBox="0 0 24 24">
    <path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M5 20a7 7 0 0 1 14 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { language, t } = useLanguage()
  const [isUserMenuPinned, setIsUserMenuPinned] = useState(false)
  const [isUserMenuHovered, setIsUserMenuHovered] = useState(false)
  const [isUserMenuHoverSuppressed, setIsUserMenuHoverSuppressed] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const isUserMenuOpen =
    isUserMenuPinned || (isUserMenuHovered && !isUserMenuHoverSuppressed)

  useEffect(() => {
    if (!isUserMenuPinned) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuPinned(false)
        setIsUserMenuHoverSuppressed(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuPinned(false)
        setIsUserMenuHoverSuppressed(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isUserMenuPinned])

  function closeUserMenu() {
    setIsUserMenuPinned(false)
    setIsUserMenuHovered(false)
    setIsUserMenuHoverSuppressed(false)
  }

  return (
    <header className="navbar-wrap">
      <nav className="navbar">
        <NavLink to={isAuthenticated ? '/' : '/login'} className="navbar__brand">
          <img
            src="/favicon.svg"
            alt=""
            width={34}
            height={34}
            className="navbar__brand-mark"
          />
          <span className="navbar__brand-copy">
            <span className="navbar__brand-title">{t.appName}</span>
            <span className="navbar__brand-subtitle">{t.brandSubtitle}</span>
          </span>
        </NavLink>

        <div className="navbar__cluster">
          <div className="navbar__links">
            {isAuthenticated && user ? (
              <>
                <NavItem to="/" end label={t.nav.inventory} />
                {user.role === 'Admin' ? (
                  <>
                    <NavItem to="/users" label={t.nav.users} />
                    <NavItem to="/all-checkouts" label={t.nav.allCheckouts} />
                  </>
                ) : (
                  <NavItem to="/my-items" label={t.nav.myItems} />
                )}
              </>
            ) : (
              REGISTRATION_ENABLED && <NavItem to="/login" label={t.nav.login} />
            )}
          </div>

          {isAuthenticated && user && (
            <div className="navbar__session">
              <div
                className="navbar__user-menu"
                ref={userMenuRef}
                onMouseEnter={() => {
                  if (!isUserMenuHoverSuppressed) {
                    setIsUserMenuHovered(true)
                  }
                }}
                onMouseLeave={() => {
                  setIsUserMenuHovered(false)
                  setIsUserMenuHoverSuppressed(false)
                }}
              >
                <button
                  type="button"
                  className={`navbar__user-trigger ${
                    isUserMenuOpen ? 'navbar__user-trigger--open' : ''
                  }`}
                  onClick={() => {
                    if (isUserMenuPinned) {
                      setIsUserMenuPinned(false)
                      setIsUserMenuHovered(false)
                      setIsUserMenuHoverSuppressed(true)
                      return
                    }

                    setIsUserMenuPinned(true)
                    setIsUserMenuHovered(true)
                    setIsUserMenuHoverSuppressed(true)
                  }}
                  aria-expanded={isUserMenuOpen}
                  aria-label={
                    isUserMenuOpen ? t.nav.closeUserMenu : t.nav.openUserMenu
                  }
                >
                  <span className="navbar__user-icon" aria-hidden="true">
                    {personIcon}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div
                    className="navbar__dropdown navbar__dropdown--open"
                    role="group"
                    aria-label={t.nav.accountMenu}
                  >
                    <div className="navbar__menu-head">
                      <strong className="navbar__menu-name">
                        {user.name}
                        {user.role === 'Admin' && (
                          <span className="navbar__menu-role">
                            {' '}
                            ({getRoleLabel(user.role, language)})
                          </span>
                        )}
                      </strong>
                      <span className="navbar__menu-email">{user.email}</span>
                    </div>

                    <div className="navbar__menu-links">
                      <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                          `navbar__menu-link ${isActive ? 'navbar__menu-link--active' : ''}`
                        }
                        onClick={closeUserMenu}
                      >
                        <span className="navbar__menu-link-icon" aria-hidden="true">
                          {personIcon}
                        </span>
                        <span className="navbar__menu-link-title">{t.nav.profile}</span>
                      </NavLink>

                      <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                          `navbar__menu-link ${isActive ? 'navbar__menu-link--active' : ''}`
                        }
                        onClick={closeUserMenu}
                      >
                        <span className="navbar__menu-link-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path
                              d="M12 9.2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 0 0 12 9.2Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            />
                            <path
                              d="M19.4 13.5v-3l-2-.5a5.9 5.9 0 0 0-.7-1.6l1.1-1.7-2.1-2.1-1.7 1.1a5.9 5.9 0 0 0-1.6-.7l-.5-2h-3l-.5 2a5.9 5.9 0 0 0-1.6.7L5.8 4.6 3.7 6.7l1.1 1.7a5.9 5.9 0 0 0-.7 1.6l-2 .5v3l2 .5c.1.6.4 1.1.7 1.6l-1.1 1.7 2.1 2.1 1.7-1.1c.5.3 1 .6 1.6.7l.5 2h3l.5-2c.6-.1 1.1-.4 1.6-.7l1.7 1.1 2.1-2.1-1.1-1.7c.3-.5.6-1 .7-1.6l2-.5Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="navbar__menu-link-title">{t.nav.settings}</span>
                      </NavLink>
                    </div>

                    <button
                      type="button"
                      className="navbar__dropdown-logout"
                      onClick={() => {
                        closeUserMenu()
                        logout()
                      }}
                    >
                      <span className="navbar__dropdown-logout-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path
                            d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 12h9"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <path
                            d="m16 8 4 4-4 4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar
