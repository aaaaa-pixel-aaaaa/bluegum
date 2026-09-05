import { useEffect, useState } from 'react'
import type { Title } from '../../../shared/types'
import { searchTitles } from '../lib/tmdb'
import { Poster } from './Poster'

type SearchFieldProps = {
  onPick: (title: Title) => void
  excludeIds: Set<number>
  placeholder?: string
}

export function SearchField({ onPick, excludeIds, placeholder = 'Search films and shows' }: SearchFieldProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Title[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      searchTitles(query, controller.signal)
        .then((titles) => setResults(titles.filter((t) => !excludeIds.has(t.tmdbId)).slice(0, 8)))
        .catch(() => {})
    }, 250)
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, excludeIds])

  return (
    <div className="mx-auto w-full max-w-md px-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full border-b border-bloom bg-transparent font-sans text-base text-heartwood placeholder:text-heartwood/40 focus:outline-none"
      />
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-bloom">
          {results.map((title) => (
            <li key={title.tmdbId}>
              <button
                type="button"
                onClick={() => {
                  onPick(title)
                  setQuery('')
                  setResults([])
                }}
                className="press flex min-h-11 w-full items-center gap-3 py-2 text-left active:bg-bloom/40"
              >
                <Poster posterPath={title.posterPath} title={title.title} width={40} />
                <span className="font-sans text-base text-heartwood">
                  {title.title}
                  {title.year ? `, ${title.year}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
