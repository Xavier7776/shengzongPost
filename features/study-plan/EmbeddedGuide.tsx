import { ArrowUpRight } from 'lucide-react'
import { studyPilotTitles } from '@/features/study-records/study-pilot-titles'
import { sourceLinks } from './curriculum'
import { embeddedDividerLab, embeddedGuideSections, embeddedHalCourse, embeddedIntroVideos, embeddedLessonId, type EmbeddedIntroId } from './embedded-guide'

type LessonResource = { name: string; url: string }

const beginnerLessons = {
  'hw-1': {
    learn: '先花 10–15 分钟做一次分压。串联电阻流过同样的电流，每个电阻两端的电压用 U = I × R 算。',
    practice: '在 PhET 放一个电池和两个电阻，点元件把数值改为 6 V、10 Ω、10 Ω。用导线从电池正极依次接两个电阻，再接回负极。把负极当作 0 V，电压表黑笔接负极，红笔接两个电阻的交点。',
    check: '交点应读到约 3 V。把靠近负极的电阻换成 20 Ω，先算，再测，读数应接近 4 V。也可以用纸写下 6 × 20 ÷ (10 + 20) 来对照。',
    resources: [embeddedDividerLab],
    review: [
      embeddedIntroVideos['hw-1'],
      { name: '物理余老师 · 串联电路（7 分钟）', url: 'https://www.bilibili.com/video/BV1Kx4y1s7S5/' },
      { name: '物理余老师 · 欧姆定律虚拟实验（19 分钟）', url: 'https://www.bilibili.com/video/BV1FXpoe5EHZ/' },
    ],
  },
  'hw-2': {
    learn: '跟着实物演示认出 LED 正负极，看看串进同一个回路的电阻怎样限制电流。',
    practice: '在纸上画出 5 V 电源、电阻、LED 和回到负极的连线。假设 LED 压降 2 V，目标电流 5 mA，算一算电阻。',
    check: '电阻两端分到 3 V，按 3 ÷ 0.005 算得 600 Ω。若手边只有 680 Ω，估算电流约为 4.4 mA。',
    resources: [{ name: '立创 · 限流电阻计算图解', url: sourceLinks['hw-2']! }],
  },
  'hw-3': {
    learn: '先看电容器接通电源和断开电源后发生了什么。去耦可以先记成一句话，芯片旁边的电容在电流突然变大时能暂时补一点电。',
    practice: '在 PhET 放入电池、电阻、电容和开关，用电压表盯住电容两端。先经过电阻充电，再断开电池，让电容经电阻形成放电回路。',
    check: '能看到充电时电压逐渐上升，放电时逐渐下降。看到这两段变化，再去图文里找芯片旁边的电容。',
    resources: [
      { name: '打开 PhET 中文仿真（含电容）', url: 'https://phet.colorado.edu/zh_CN/simulations/circuit-construction-kit-ac-virtual-lab' },
      { name: '立创 · 电容与去耦图解', url: sourceLinks['hw-3']! },
    ],
  },
  'hw-4': {
    learn: '用已经会的 C 写法做个小例子。先读网道的指针例子，理解 & 取地址和 * 访问对应的值。视频里遇到外设地址时先看懂读写动作。',
    practice: '声明一个 int 数组，用指针把第一项改掉。然后用包含编号和值的结构体替换数组元素。',
    check: '打印修改前后的值，能解释为什么通过指针修改后，用原数组也能读到新值。',
    resources: [
      { name: '网道 · C 指针', url: 'https://wangdoc.com/clang/pointer' },
      { name: '网道 · C 结构体', url: 'https://wangdoc.com/clang/struct' },
    ],
  },
  'hw-5': {
    learn: '翻到图文的位运算符，先做左移、按位或、按位与。视频先跟位操作部分，遇到字节序可以以后再回看。',
    practice: '把一个值初始化成 0，用 1u << 2 得到掩码，用 | 设置从右边数第三位，再用 & 和 ~ 清除该位。',
    check: '打印结果应依次是 0、4、0。再试初始值 1，结果应依次是 1、5、1，确认其他位不受影响。',
    resources: [{ name: '网道 · C 位运算符和代码例子', url: 'https://wangdoc.com/clang/operator#位运算符' }],
  },
  'hw-6': {
    learn: '对照手头开发板的型号找原理图。看视频认出引脚编号，再在原理图里找电源、GND、复位和一颗板载 LED。',
    practice: '在板图或手绘图上标出 USB 口、供电脚、GND 和 LED，顺着 LED 的连线找到它的 GPIO 编号。',
    check: '能用自己的原理图指出 LED 在哪个 GPIO 上，并找出亮灯需要的电平。还没有开发板时，可先用野火示例图。',
    resources: [{ name: '野火 · 初识 STM32 与开发板硬件', url: sourceLinks['hw-6']! }],
  },
  'hw-7': {
    learn: '先看搭建环境的小节，再跟点灯分集。手头板子的型号、LED 引脚和亮灭电平用上一节查到的值。',
    practice: '建 HAL 工程，把 LED 的 GPIO 配成输出。先烧录固定亮灯，再加入延时和翻转输出。',
    check: '改一次延时时间、重新烧录，板载 LED 的闪烁快慢随之改变。',
    resources: [
      { name: '韦东山 · 搭建开发环境（7 分钟）', url: embeddedHalCourse + '?p=5' },
      { name: '野火 · HAL 点灯图文', url: sourceLinks['hw-7']! },
    ],
  },
  'hw-8': {
    learn: '视频先跟到能读到按键的状态。按下时读到高还是低，以自己的板子原理图和实测为准。',
    practice: '按下时翻转 LED。检测到状态变化后等约 20 毫秒再读一次，确认仍按下才翻转，松开后才允许下一次触发。',
    check: '连续短按 10 次，每按一次只翻转一次。长按也只触发一次。',
    resources: [{ name: '野火 · GPIO 输入与按键检测图文', url: sourceLinks['hw-8']! }],
  },
} satisfies Record<EmbeddedIntroId, { learn: string; practice: string; check: string; resources: LessonResource[]; review?: LessonResource[] }>

const circuitLessons: EmbeddedIntroId[] = ['hw-1', 'hw-2', 'hw-3', 'hw-4', 'hw-5']
const stm32Lessons: EmbeddedIntroId[] = ['hw-6', 'hw-7', 'hw-8']

const stages = [
  {
    id: embeddedGuideSections.basics,
    title: '电路与嵌入式 C',
    learn: '先用分压实验找回电路手感，再认识 LED 和电容，最后用小程序复习 C。',
    lessons: circuitLessons,
    name: '立创 · 嵌入式基础知识速查',
    url: 'https://openkits-wiki.easyeda.com/zh-hans/fdb/basic/review.html',
  },
  {
    id: embeddedGuideSections.stm32,
    title: 'STM32 裸机与常用外设',
    learn: '从认板、点灯和按键开始。做完这三节，再按每日任务顺序学串口、定时器和 ADC。野火图文用 STM32F103，跟教程时要核对手头开发板和它的原理图。',
    lessons: stm32Lessons,
    name: '野火 · STM32 HAL 完整目录',
    url: 'https://doc.embedfire.com/mcu/stm32/f103/hal_generalzh/latest/index.html',
  },
  {
    id: embeddedGuideSections.project,
    title: '做出第一个采集项目',
    learn: '把 ADC、定时器和串口接到同一个工程里。ADC 负责读电压，定时器决定采样间隔，串口把结果发给电脑。',
    practice: '用电位器做输入，每隔固定时间采样一次，让电脑每行收到样本序号、原始读数和换算电压。',
    check: '转动电位器能看到数据随之变化。重启后能再次采样，并留下接线图、串口参数和一段输出样例。',
    name: '野火 · ADC 单通道采集实验',
    url: 'https://doc.embedfire.com/mcu/stm32/f103/hal_generalzh/latest/doc/chapter29/chapter29.html#id26',
  },
  {
    id: embeddedGuideSections.rtos,
    title: '用 FreeRTOS 改造采集项目',
    learn: '从野火教程的「应用开发」部分开始，按任务创建、任务延时、消息队列、互斥量的顺序学。',
    practice: '将采样和串口输出拆成两个任务，用队列传递采样值。人为放慢串口输出，观察队列满时程序怎样处理。',
    check: '能解释采样任务如何保持节奏、数据经过哪条队列，以及队列满时选择等待还是丢弃。',
    name: '野火 · FreeRTOS 完整目录',
    url: 'https://doc.embedfire.com/rtos/freertos/zh/latest/index.html',
  },
]

const link = 'inline-flex min-h-9 items-center gap-1.5 rounded text-sm font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'

function LessonLinks({ resources }: { resources: LessonResource[] }) {
  return <ul className="mb-2 mt-1 flex flex-wrap gap-x-4">
    {resources.map(resource => <li key={resource.url}>
      <a href={resource.url} target="_blank" rel="noreferrer" className={link}>
        {resource.name} <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
      </a>
    </li>)}
  </ul>
}

function BeginnerLesson({ taskId }: { taskId: EmbeddedIntroId }) {
  const lesson = beginnerLessons[taskId]
  const resources = 'review' in lesson ? lesson.resources : [embeddedIntroVideos[taskId], ...lesson.resources]

  return <li className="py-4">
    <h4 id={embeddedLessonId(taskId)} tabIndex={-1} className="scroll-mt-28 text-base font-semibold text-slate-900">
      {studyPilotTitles[taskId]}
    </h4>
    <p className="mt-1.5 max-w-[72ch] text-sm leading-6 text-slate-700">{lesson.learn}</p>
    <LessonLinks resources={resources} />
    <dl className="max-w-[72ch] space-y-1 text-sm leading-6 text-slate-700">
      <div><dt className="inline font-semibold text-slate-900">动手练</dt><dd className="ml-2 inline">{lesson.practice}</dd></div>
      <div><dt className="inline font-semibold text-slate-900">做到这一步</dt><dd className="ml-2 inline">{lesson.check}</dd></div>
    </dl>
    {'review' in lesson && <details className="mt-2">
      <summary className="w-fit cursor-pointer rounded py-2 text-sm font-semibold text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">按需回看基础视频</summary>
      <LessonLinks resources={lesson.review} />
    </details>}
  </li>
}

export default function EmbeddedGuide() {
  return <section id="study-embedded" tabIndex={-1} aria-labelledby="embedded-heading"
    className="mt-9 scroll-mt-24 rounded-xl border border-slate-200 bg-white sm:mt-10">
    <header className="px-4 py-4 sm:px-6 sm:py-5">
      <h2 id="embedded-heading" className="text-xl font-bold tracking-tight">嵌入式学习指南</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">先用分压仿真复习电路，再用 STM32 点亮第一颗灯。</p>
    </header>
    <details className="border-t border-slate-200">
      <summary className="cursor-pointer rounded-b-xl px-4 py-3.5 text-sm font-semibold text-blue-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:px-6">学习步骤、中文视频和图文</summary>
      <div className="px-4 pb-5 sm:px-6">
        <ol className="divide-y divide-slate-200">
          {stages.map((stage, index) => <li key={stage.title} className="py-4 sm:py-5">
            <h3 id={stage.id} tabIndex={-1} className="scroll-mt-28 text-base font-semibold tracking-tight text-slate-900">{index + 1}. {stage.title}</h3>
            <p className="mt-1.5 max-w-[72ch] text-sm leading-6 text-slate-700">{stage.learn}</p>
            {stage.lessons ? <ol className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
              {stage.lessons.map(taskId => <BeginnerLesson key={taskId} taskId={taskId} />)}
            </ol> : <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm leading-6 sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-900">动手练</dt><dd className="text-slate-700">{stage.practice}</dd></div>
              <div><dt className="font-semibold text-slate-900">做到这一步</dt><dd className="text-slate-700">{stage.check}</dd></div>
            </dl>}
            <a href={stage.url} target="_blank" rel="noreferrer" className={link + ' mt-2'}>
              {stage.name} <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
            </a>
          </li>)}
        </ol>
        <div className="border-t border-slate-200 pt-4 text-sm leading-6">
          <h3 className="text-base font-semibold text-slate-900">做完采集项目后可以选一个方向</h3>
          <div className="mt-2 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div>
              <h4 id={embeddedGuideSections.pcb} tabIndex={-1} className="scroll-mt-28 font-semibold">想自己画板</h4>
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
