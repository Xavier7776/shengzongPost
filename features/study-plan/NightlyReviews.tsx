import type { NightlyReview } from '@/lib/db/study-nightly'

const dateFormat = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', timeZone: 'UTC' })
const label = (date: string) => dateFormat.format(new Date(date + 'T00:00:00Z'))

function ReviewContent({ review }: { review: NightlyReview }) {
  const { analysis } = review
  if (review.recordCount === 0) return <p className="text-sm leading-6 text-slate-600">复盘时还没有收到当天的学习记录。</p>
  if (!analysis) return <p className="text-sm leading-6 text-slate-600">暂时无法读取这份分析。</p>
  return <div className="space-y-4 text-sm leading-6 text-slate-700">
    <p className="max-w-[68ch] whitespace-pre-line [overflow-wrap:anywhere]">{analysis.summary}</p>
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-7">
      <div>
        <h3 className="font-semibold text-slate-900">待巩固</h3>
        {analysis.blockers.length > 0 ? <ul className="mt-1 list-disc space-y-1 pl-4 [overflow-wrap:anywhere]">
          {analysis.blockers.map((item, i) => <li key={i}>{item}</li>)}
        </ul> : <p className="mt-1 text-slate-600">记录中没有标记待巩固的内容。</p>}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">下一步</h3>
        <ol className="mt-1 list-decimal space-y-1 pl-4 [overflow-wrap:anywhere]">
          {analysis.nextSteps.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      </div>
    </div>
  </div>
}

export default function NightlyReviews({ reviews }: { reviews: NightlyReview[] | null }) {
  const latest = reviews?.[0]
  const older = reviews?.slice(1) ?? []
  return <section id="study-nightly" aria-labelledby="nightly-heading" className="mt-9 scroll-mt-24 rounded-xl border border-slate-200 bg-white sm:mt-10">
    <header className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2 px-4 py-4 sm:px-6">
      <div>
        <h2 id="nightly-heading" className="text-lg font-bold tracking-tight">晚间复盘</h2>
        <p className="mt-1 text-xs leading-5 text-slate-600">每天 23:00（北京时间） · DeepSeek V4.1 Flash</p>
      </div>
      {latest && <p className="text-sm font-medium tabular-nums text-slate-700">
        <time dateTime={latest.date}>{label(latest.date)}</time>
        {latest.recordCount > 0 && <span className="ml-2 text-xs font-normal text-slate-600">{latest.recordCount} 项 / {latest.minutes} 分钟</span>}
      </p>}
    </header>
    <div className="border-t border-slate-200 px-4 py-4 sm:px-6">
      {latest ? <ReviewContent review={latest} /> : <p className="text-sm leading-6 text-slate-600">
        {reviews === null ? '暂时无法读取复盘，请稍后刷新。' : '首次复盘会在定时任务运行后出现。'}
      </p>}
    </div>
    {older.length > 0 && <details className="border-t border-slate-200 px-4 sm:px-6">
      <summary className="cursor-pointer py-3 text-sm font-semibold text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">查看近期复盘</summary>
      <div className="divide-y divide-slate-200 pb-2">
        {older.map(review => <details key={review.date}>
          <summary className="cursor-pointer py-2.5 text-sm font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
            <time dateTime={review.date}>{label(review.date)}</time> · {review.recordCount} 项 / {review.minutes} 分钟
          </summary>
          <div className="pb-4"><ReviewContent review={review} /></div>
        </details>)}
      </div>
    </details>}
  </section>
}
