import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const { all, byTag, tags, popular } = vi.hoisted(() => ({
  all:vi.fn(), byTag:vi.fn(),tags:vi.fn(),popular:vi.fn(),
}))
vi.mock('@/lib/db', () => ({
  getPostsPaginated:all,getPostsPaginatedByTag:byTag,
  getBlogTagCounts:tags,getPopularPosts:popular,
}))
vi.mock('@/app/blog/BlogList', () => ({
  default: ({selectedTag,total,page,globalTags,popularPostsData}: {
    selectedTag:string|null;total:number;page:number;
    globalTags:{tag:string;count:number}[];popularPostsData:{slug:string}[],
  }) => <div data-testid="blog-server-props">
    Tag:{selectedTag??'all'} Pages:{page} Total:{total} Counts:{globalTags[0]?.count??0}
    Popular:{popularPostsData[0]?.slug??'none'}
  </div>,
}))
import BlogPage from '@/app/blog/page'
beforeEach(() => {
  for(const fn of [all,byTag,tags,popular])fn.mockReset()
  all.mockResolvedValue({posts:[],total:104})
  byTag.mockResolvedValue({posts:[],total:27})
  tags.mockResolvedValue([{tag:'RAG',count:27}])
  popular.mockResolvedValue([{slug:'top-global-post'}])
})
describe('blog SSR pagination and real totals',()=>{
  it('passes global categories/popularity to the client for the unfiltered index',async()=>{
    render(await BlogPage({searchParams:Promise.resolve({page:'1'})}))
    expect(screen.getByTestId('blog-server-props')).toHaveTextContent('Tag:all')
    expect(screen.getByTestId('blog-server-props')).toHaveTextContent('Total:104')
    expect(screen.getByTestId('blog-server-props')).toHaveTextContent('Counts:27')
    expect(screen.getByTestId('blog-server-props')).toHaveTextContent('Popular:top-global-post')
    expect(all).toHaveBeenCalledWith(1,12)
    expect(byTag).not.toHaveBeenCalled()
  })
  it('loads page 2 of the chosen category from the database, not the client slice',async()=>{
    render(await BlogPage({searchParams:Promise.resolve({page:'2',tag:'RAG'})}))
    expect(byTag).toHaveBeenCalledWith(2,12,'RAG')
    expect(screen.getByTestId('blog-server-props')).toHaveTextContent('Tag:RAG')
    expect(screen.getByTestId('blog-server-props')).toHaveTextContent('Total:27')
  })
  it('ignores oversized tag values instead of making an unbounded query',async()=>{
    render(await BlogPage({searchParams:Promise.resolve({tag:'X'.repeat(101)})}))
    expect(byTag).not.toHaveBeenCalled()
    expect(all).toHaveBeenCalledWith(1,12)
  })
})
