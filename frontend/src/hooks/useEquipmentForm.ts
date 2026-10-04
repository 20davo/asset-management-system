import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useLanguage } from '../context/LanguageContext'

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024
// The API accepts only these types.
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface EquipmentFormState {
  name: string
  category: string
  description: string
  image: File | null
  imagePreviewUrl: string
  removeImage: boolean
  serialNumber: string
}

export const emptyEquipmentForm: EquipmentFormState = {
  name: '',
  category: '',
  description: '',
  image: null,
  imagePreviewUrl: '',
  removeImage: false,
  serialNumber: '',
}

interface UseEquipmentFormOptions {
  categories: string[]
  onClearMessages: () => void
  onError: (message: string) => void
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Invalid file result.'))
    }

    reader.onerror = () => reject(reader.error ?? new Error('File read failed.'))
    reader.readAsDataURL(file)
  })
}

export function getUniqueCategories(categories: string[], language: string) {
  const unique = new Map<string, string>()

  for (const category of categories) {
    const trimmedCategory = category.trim()
    const normalizedKey = trimmedCategory.toLocaleLowerCase(language)

    if (trimmedCategory && !unique.has(normalizedKey)) {
      unique.set(normalizedKey, trimmedCategory)
    }
  }

  return Array.from(unique.values()).sort((left, right) => left.localeCompare(right, language))
}

export function useEquipmentForm({ categories, onClearMessages, onError }: UseEquipmentFormOptions) {
  const { language, t } = useLanguage()
  const [form, setForm] = useState<EquipmentFormState>(emptyEquipmentForm)

  function normalizeCategoryValue(rawCategory: string, knownCategories = categories) {
    const trimmedCategory = rawCategory.trim()

    if (!trimmedCategory) {
      return ''
    }

    const existingCategory = knownCategories.find(
      (category) =>
        category.trim().toLocaleLowerCase(language) ===
        trimmedCategory.toLocaleLowerCase(language),
    )

    return existingCategory ?? trimmedCategory
  }

  function updateCategory(rawCategory: string) {
    setForm((prev) => ({ ...prev, category: rawCategory }))
  }

  function normalizeCategory() {
    setForm((prev) => ({ ...prev, category: normalizeCategoryValue(prev.category) }))
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    onClearMessages()

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      onError(t.inventory.imageInvalidType)
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      onError(t.inventory.imageTooLarge)
      event.target.value = ''
      return
    }

    try {
      const imageUrl = await readFileAsDataUrl(file)

      setForm((prev) => ({
        ...prev,
        image: file,
        imagePreviewUrl: imageUrl,
        removeImage: false,
      }))
    } catch {
      onError(t.inventory.imageInvalidType)
    } finally {
      event.target.value = ''
    }
  }

  function removeImage() {
    onClearMessages()
    setForm((prev) => ({
      ...prev,
      image: null,
      imagePreviewUrl: '',
      removeImage: true,
    }))
  }

  function getPayload(knownCategories = categories) {
    return {
      name: form.name.trim(),
      category: normalizeCategoryValue(form.category, knownCategories),
      description: form.description.trim() || undefined,
      image: form.image,
      removeImage: form.removeImage,
      serialNumber: form.serialNumber.trim(),
    }
  }

  return {
    form,
    setForm,
    updateCategory,
    normalizeCategory,
    handleImageChange,
    removeImage,
    getPayload,
  }
}
