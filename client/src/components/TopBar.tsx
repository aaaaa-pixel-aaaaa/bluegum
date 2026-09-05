export function TopBar({ title, onAbout }: { title: string; onAbout: () => void }) {
  return (
    <header className="mx-auto flex w-full max-w-md items-center justify-between px-6 pt-6">
      <h1 className="font-sans text-base font-medium text-heartwood">{title}</h1>
      <button
        type="button"
        onClick={onAbout}
        className="press min-h-11 px-2 font-sans text-base text-heartwood/60 active:text-heartwood"
      >
        About
      </button>
    </header>
  )
}
