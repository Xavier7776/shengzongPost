import { ArrowUpRight } from 'lucide-react'

const stages = [
  {
    title: '电路与嵌入式 C',
    learn: '先看电压、电流、共地、电阻和电容。C 语言重点复习指针、结构体、位运算和寄存器掩码。',
    practice: '画一个电阻分压电路，算出输出电压。再用仿真或面包板验证，练习给 LED 选限流电阻。',
    check: '能解释为什么要加限流电阻，也能写出设置或清除寄存器某一位的 C 代码。',
    name: '立创 · 嵌入式基础知识',
    url: 'https://openkits-wiki.easyeda.com/zh-hans/fdb/basic/review.html',
  },
  {
    title: 'STM32 裸机与常用外设',
    learn: '跟野火的 HAL 教程建工程。按点灯、按键、串口、中断和定时器的顺序练习。接下来学 ADC，再选 I²C 或 SPI 接一个外设。',
    practice: '让开发板回显电脑发送的字符，然后用定时器控制闪灯，检查等待串口数据时闪灯是否仍在继续。',
    check: '能从空工程重新做出闪灯和串口回显，并说清楚引脚、波特率及定时器配置。',
    name: '野火 · STM32 HAL 完整目录',
    url: 'https://doc.embedfire.com/mcu/stm32/f103/hal_generalzh/latest/index.html',
  },
  {
    title: '做出第一个采集项目',
    learn: '把 ADC、定时器和串口接到同一个工程里。ADC 负责读电压，定时器决定采样间隔，串口把结果发给电脑。',
    practice: '用电位器做输入，每隔固定时间采样一次，让电脑每行收到样本序号、原始读数和换算电压。',
    check: '转动电位器能看到数据随之变化。重启后能再次采样，并留下接线图、串口参数和一段输出样例。',
    name: '野火 · ADC 单通道采集实验',
    url: 'https://doc.embedfire.com/mcu/stm32/f103/hal_generalzh/latest/doc/chapter29/chapter29.html#id26',
  },
  {
    title: '用 FreeRTOS 改造采集项目',
    learn: '从野火教程的「应用开发」部分开始，按任务创建、任务延时、消息队列、互斥量的顺序学。',
    practice: '将采样和串口输出拆成两个任务，用队列传递采样值。人为放慢串口输出，观察队列满时程序怎样处理。',
    check: '能解释采样任务如何保持节奏、数据经过哪条队列，以及队列满时选择等待还是丢弃。',
    name: '野火 · FreeRTOS 完整目录',
    url: 'https://doc.embedfire.com/rtos/freertos/zh/latest/index.html',
  },
]

const link = 'inline-flex min-h-9 items-center gap-1.5 rounded text-sm font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'

export default function EmbeddedGuide() {
  return <section id="study-embedded" tabIndex={-1} aria-labelledby="embedded-heading"
    className="mt-9 scroll-mt-24 rounded-xl border border-slate-200 bg-white sm:mt-10">
    <header className="px-4 py-4 sm:px-6 sm:py-5">
      <h2 id="embedded-heading" className="text-xl font-bold tracking-tight">嵌入式学习指南</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">先补电路和 C，再用 STM32 做一个能向电脑发送电压读数的小项目。</p>
    </header>
    <details className="border-t border-slate-200">
      <summary className="cursor-pointer rounded-b-xl px-4 py-3.5 text-sm font-semibold text-blue-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:px-6">学习步骤与中文教程</summary>
      <div className="px-4 pb-5 sm:px-6">
        <p className="max-w-[72ch] text-sm leading-6 text-slate-600">野火 HAL 示例使用 STM32F103。跟书做实验时，按手头开发板的型号和原理图核对引脚。</p>
        <ol className="mt-3 divide-y divide-slate-200">
          {stages.map((stage, index) => <li key={stage.title} className="py-4 sm:py-5">
            <h3 className="text-base font-semibold tracking-tight text-slate-900">{index + 1}. {stage.title}</h3>
            <p className="mt-1.5 max-w-[72ch] text-sm leading-6 text-slate-700">{stage.learn}</p>
            <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm leading-6 sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-900">动手练</dt><dd className="text-slate-700">{stage.practice}</dd></div>
              <div><dt className="font-semibold text-slate-900">做到这一步</dt><dd className="text-slate-700">{stage.check}</dd></div>
            </dl>
            <a href={stage.url} target="_blank" rel="noreferrer" className={link + ' mt-2'}>
              {stage.name} <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
            </a>
          </li>)}
        </ol>
        <div className="border-t border-slate-200 pt-4 text-sm leading-6">
          <h3 className="text-base font-semibold text-slate-900">做完采集项目后可以选一个方向</h3>
          <div className="mt-2 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold">想自己画板</h4>
              <p className="text-slate-700">从简单 LED 电路开始，练习原理图、封装、布线和设计规则检查。</p>
              <a href="https://wiki.lceda.cn/zh-hans/contest/e-contests/resource/" className={link} target="_blank" rel="noreferrer">嘉立创 EDA 自学资料 <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /></a>
            </div>
            <div>
              <h4 className="font-semibold">想学设备驱动</h4>
              <p className="text-slate-700">从 Linux 应用读写设备入手，再学驱动基础和应用与驱动配合的项目。</p>
              <a href="https://linux.100ask.net/docs/Learn-Linux/FromMCU-Linux/Introduction/" className={link} target="_blank" rel="noreferrer">韦东山 · 从单片机转到 Linux <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </div>
    </details>
  </section>
}
