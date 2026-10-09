export type SearchType = 'all' | 'post' | 'skill' | 'gallery'
export type SearchSort = 'relevance' | 'newest'

export interface SearchQuery {
  q: string
  type: SearchType
  sort: SearchSort
  page: number
  pageSize: number
}

export interface SearchResult {
  type: Exclude<SearchType, 'all'>
  id: string
  title: string
  excerpt: string
  url: string
  image: string | null
  tags: string[]
  meta: string
  created_at: string
}

export interface SearchResponse extends SearchQuery {
  results: SearchResult[]
  total: number
  totalPages: number
  counts: Record<SearchType, number>
}

export function parseSearchParams(params: URLSearchParams): SearchQuery {
  const q = (params.get('q') ?? '').trim()
  const type = params.get('type') ?? 'all'
  const sort = params.get('sort') ?? 'relevance'
  if (q.length > 120 || q.includes('\0')) throw new Error('关键词最多 120 字符，且不能包含空字符')
  if (!['all', 'post', 'skill', 'gallery'].includes(type)) throw new Error('无效的搜索分类')
  if (!['relevance', 'newest'].includes(sort)) throw new Error('无效的排序方式')

  function integer(value: string, max: number) {
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > max) {
      throw new Error('页码或每页数量超出范围')
    }
    return Number(value)
  }
  return {
    q, type: type as SearchType, sort: sort as SearchSort,
    page: integer(params.get('page') ?? '1', 2147483647),
    // Preserve the old API's limit parameter for existing links/callers.
    pageSize: integer(params.get('pageSize') ?? params.get('limit') ?? '20', 50),
  }
}
