import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { LanguageProvider, useLanguage } from './LanguageContext'

function LanguageSwitch() {
  const { setLanguage } = useLanguage()
  return (
    <button type="button" onClick={() => setLanguage('hu')}>
      Magyar
    </button>
  )
}

describe('LanguageProvider', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.lang = ''
  })

  it('sets the page language from the stored language', () => {
    localStorage.setItem('asset-management-language', 'hu')

    render(<LanguageProvider>{null}</LanguageProvider>)

    expect(document.documentElement.lang).toBe('hu')
  })

  it('updates the page language when the language changes', async () => {
    render(
      <LanguageProvider>
        <LanguageSwitch />
      </LanguageProvider>,
    )
    expect(document.documentElement.lang).toBe('en')

    await userEvent.click(screen.getByRole('button', { name: 'Magyar' }))

    expect(document.documentElement.lang).toBe('hu')
  })
})
