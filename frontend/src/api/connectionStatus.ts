export type ConnectionStatus = 'ok' | 'waking' | 'unreachable'

let status: ConnectionStatus = 'ok'
const listeners = new Set<() => void>()

export function getConnectionStatus() {
  return status
}

export function setConnectionStatus(nextStatus: ConnectionStatus) {
  if (status === nextStatus) {
    return
  }

  status = nextStatus
  listeners.forEach((listener) => listener())
}

export function subscribeToConnectionStatus(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
