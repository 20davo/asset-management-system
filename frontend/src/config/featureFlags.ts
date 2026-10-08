function readBooleanFlag(value: string | undefined, defaultValue: boolean) {
  if (typeof value !== 'string') {
    return defaultValue
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'false' || normalized === '0' || normalized === 'off') {
    return false
  }

  if (normalized === 'true' || normalized === '1' || normalized === 'on') {
    return true
  }

  return defaultValue
}

export const REGISTRATION_ENABLED = readBooleanFlag(
  import.meta.env.VITE_REGISTRATION_ENABLED,
  true,
)

export const DEMO_MODE = readBooleanFlag(import.meta.env.VITE_DEMO_MODE, false)

export const DEMO_ACCOUNTS = {
  adminEmail: import.meta.env.VITE_DEMO_ADMIN_EMAIL?.trim() ?? '',
  userEmail: import.meta.env.VITE_DEMO_USER_EMAIL?.trim() ?? '',
  password: import.meta.env.VITE_DEMO_PASSWORD?.trim() ?? '',
}
