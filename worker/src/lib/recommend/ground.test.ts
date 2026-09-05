import { describe, expect, it } from 'vitest'
import type { TmdbSearchResult } from '../tmdb'
import { groundCandidate } from './ground'
import type { Candidate } from './types'

const candidate: Candidate = { title: 'Heat', year: 1995, mediaType: 'movie', reason: 'x' }

describe('groundCandidate', () => {
  it('matches an exact title and year', () => {
    const results: TmdbSearchResult[] = [
      { id: 949, title: 'Heat', release_date: '1995-12-15', poster_path: '/p.jpg' },
    ]
    expect(groundCandidate(candidate, results, 'movie')).toEqual({
      tmdbId: 949,
      mediaType: 'movie',
      title: 'Heat',
      year: 1995,
      posterPath: '/p.jpg',
      reason: 'x',
    })
  })

  it('allows a release year one off from what Claude said', () => {
    const results: TmdbSearchResult[] = [
      { id: 949, title: 'Heat', release_date: '1996-01-01', poster_path: null },
    ]
    expect(groundCandidate(candidate, results, 'movie')).not.toBeNull()
  })

  it('rejects a year more than one off', () => {
    const results: TmdbSearchResult[] = [
      { id: 949, title: 'Heat', release_date: '1990-01-01', poster_path: null },
    ]
    expect(groundCandidate(candidate, results, 'movie')).toBeNull()
  })

  it('rejects an unrelated title even in the right year', () => {
    const results: TmdbSearchResult[] = [
      { id: 1, title: 'Casino', release_date: '1995-11-22', poster_path: null },
    ]
    expect(groundCandidate(candidate, results, 'movie')).toBeNull()
  })

  it('is case- and punctuation-insensitive', () => {
    const results: TmdbSearchResult[] = [
      { id: 949, title: 'HEAT:', release_date: '1995-12-15', poster_path: null },
    ]
    expect(groundCandidate(candidate, results, 'movie')).not.toBeNull()
  })

  it('matches a tv result on first_air_date', () => {
    const tvCandidate: Candidate = { title: 'The Wire', year: 2002, mediaType: 'tv', reason: 'x' }
    const results: TmdbSearchResult[] = [
      { id: 1438, name: 'The Wire', first_air_date: '2002-06-02', poster_path: null },
    ]
    expect(groundCandidate(tvCandidate, results, 'tv')?.tmdbId).toBe(1438)
  })

  it('prefers an exact title match over a looser containing match', () => {
    const results: TmdbSearchResult[] = [
      { id: 2, title: 'Heat Wave', release_date: '1995-06-01', poster_path: null },
      { id: 949, title: 'Heat', release_date: '1995-12-15', poster_path: null },
    ]
    expect(groundCandidate(candidate, results, 'movie')?.tmdbId).toBe(949)
  })

  it('returns null with no results', () => {
    expect(groundCandidate(candidate, [], 'movie')).toBeNull()
  })

  it('returns null when a result has no usable date', () => {
    const results: TmdbSearchResult[] = [{ id: 949, title: 'Heat', poster_path: null }]
    expect(groundCandidate(candidate, results, 'movie')).toBeNull()
  })
})
