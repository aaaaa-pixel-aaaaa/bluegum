import { describe, expect, it } from 'vitest'
import { parseCandidates, stripFences } from './parse'

const valid = [{ title: 'Heat', year: 1995, mediaType: 'movie' as const, reason: 'x' }]

describe('stripFences', () => {
  it('leaves plain JSON untouched', () => {
    expect(stripFences('[1,2,3]')).toBe('[1,2,3]')
  })

  it('strips a ```json fenced block', () => {
    expect(stripFences('```json\n[1,2,3]\n```')).toBe('[1,2,3]')
  })

  it('strips a bare ``` fenced block', () => {
    expect(stripFences('```\n[1,2,3]\n```')).toBe('[1,2,3]')
  })
})

describe('parseCandidates', () => {
  it('parses a valid JSON array', () => {
    expect(parseCandidates(JSON.stringify(valid))).toEqual(valid)
  })

  it('parses through markdown fences', () => {
    const raw = '```json\n' + JSON.stringify(valid) + '\n```'
    expect(parseCandidates(raw)).toEqual(valid)
  })

  it('returns null for malformed JSON', () => {
    expect(parseCandidates('not json')).toBeNull()
  })

  it('returns null for a non-array payload', () => {
    expect(parseCandidates(JSON.stringify({ title: 'Heat' }))).toBeNull()
  })

  it('drops entries missing required fields, keeps the rest', () => {
    const raw = JSON.stringify([...valid, { title: 'Missing year', mediaType: 'movie', reason: 'x' }])
    expect(parseCandidates(raw)).toEqual(valid)
  })

  it('drops entries with an invalid mediaType', () => {
    const raw = JSON.stringify([...valid, { title: 'Bad', year: 2000, mediaType: 'podcast', reason: 'x' }])
    expect(parseCandidates(raw)).toEqual(valid)
  })

  it('returns null when nothing valid survives', () => {
    expect(parseCandidates(JSON.stringify([{ title: 'bad' }]))).toBeNull()
  })

  it('returns null for an empty array', () => {
    expect(parseCandidates('[]')).toBeNull()
  })
})
