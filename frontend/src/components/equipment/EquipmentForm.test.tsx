import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '../../context/LanguageContext'
import {
  emptyEquipmentForm,
  EquipmentForm,
  type EquipmentFormState,
} from './EquipmentForm'

// A one pixel GIF, so the preview renders without a network request.
const PREVIEW_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

interface RenderFormOptions {
  form?: Partial<EquipmentFormState>
  onCancel?: () => void
  onRemoveImage?: () => void
}

function renderForm(options: RenderFormOptions = {}) {
  render(
    <LanguageProvider>
      <EquipmentForm
        categoryDatalistId="categories"
        form={{ ...emptyEquipmentForm, ...options.form }}
        idPrefix="create"
        isSubmitting={false}
        mediaFallbackName="Name"
        onCancel={options.onCancel}
        onCategoryBlur={() => undefined}
        onCategoryChange={() => undefined}
        onImageChange={() => undefined}
        onRemoveImage={options.onRemoveImage ?? (() => undefined)}
        onSubmit={(event) => event.preventDefault()}
        setForm={() => undefined}
        submitLabel="Save asset"
        submittingLabel="Saving..."
      />
    </LanguageProvider>,
  )
}

describe('EquipmentForm', () => {
  beforeAll(() => {
    // jsdom has no layout, so the form's scroll effect needs a stub.
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('leaves out the cancel button when there is no cancel handler', () => {
    renderForm()

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('calls the cancel handler when the cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderForm({ onCancel })

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('only offers the picker while no image is selected', () => {
    renderForm()

    expect(screen.getByLabelText('Choose image')).toBeInTheDocument()
    expect(screen.getByText('No image')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Remove image' }),
    ).not.toBeInTheDocument()
  })

  it('offers replace and remove next to the preview once an image is selected', async () => {
    const user = userEvent.setup()
    const onRemoveImage = vi.fn()
    renderForm({ form: { imagePreviewUrl: PREVIEW_DATA_URL }, onRemoveImage })

    expect(screen.getByLabelText('Replace image')).toBeInTheDocument()
    expect(screen.queryByLabelText('Choose image')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Name' })).toHaveAttribute(
      'src',
      PREVIEW_DATA_URL,
    )

    await user.click(screen.getByRole('button', { name: 'Remove image' }))

    expect(onRemoveImage).toHaveBeenCalledTimes(1)
  })
})
