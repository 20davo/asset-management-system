import { useLanguage } from '../../context/LanguageContext'
import { SegmentedControl } from './SegmentedControl'

type ListView = 'cards' | 'list'

interface ViewSwitchProps {
  onChange: (view: ListView) => void
  value: ListView
}

function CardsIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" />
        <rect x="9" y="9" width="5" height="5" rx="1" />
      </g>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="2.8" cy="4" r="1" />
        <circle cx="2.8" cy="8" r="1" />
        <circle cx="2.8" cy="12" r="1" />
      </g>
      <path
        d="M6 4h8M6 8h8M6 12h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ViewSwitch({ onChange, value }: ViewSwitchProps) {
  const { t } = useLanguage()

  return (
    <SegmentedControl
      label={t.common.view}
      value={value}
      onChange={onChange}
      options={[
        { value: 'cards', label: t.common.cardsView, icon: <CardsIcon /> },
        { value: 'list', label: t.common.listView, icon: <ListIcon /> },
      ]}
    />
  )
}
