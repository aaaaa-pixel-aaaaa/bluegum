export type Tab = 'picks' | 'saved' | 'seen'

const TABS: { key: Tab; label: string }[] = [
  { key: 'picks', label: 'Picks' },
  { key: 'saved', label: 'Saved' },
  { key: 'seen', label: 'Seen' },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 flex border-t border-bloom bg-paper"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`press min-h-11 flex-1 py-3 font-sans text-base active:text-sickle ${
            active === tab.key ? 'text-sickle' : 'text-heartwood/60'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
