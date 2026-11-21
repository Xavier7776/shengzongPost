import { studyPilotTitles } from '@/features/study-records/study-pilot-titles'

export const embeddedGuideSections = {
  basics: 'study-embedded-basics',
  stm32: 'study-embedded-stm32',
  project: 'study-embedded-project',
  rtos: 'study-embedded-rtos',
  pcb: 'study-embedded-pcb',
} as const

export const embeddedHalCourse = 'https://www.bilibili.com/video/BV1Ey4y1w7wN/'

export const embeddedIntroVideos = {
  'hw-1': { name: '大墨老师 · 电流、电压与电阻（15 分钟）', url: 'https://www.bilibili.com/video/BV1vR4y177NZ/' },
  'hw-2': { name: '寒武纪魔道电子 · LED 实物演示与限流（4 分钟）', url: 'https://www.bilibili.com/video/BV1EJ411P71U/' },
  'hw-3': { name: '橘老师实验室 · 电容器充放电（3 分钟）', url: 'https://www.bilibili.com/video/BV15y4y1k7TE/' },
  'hw-4': { name: '韦东山 · C 指针与硬件（34 分钟）', url: embeddedHalCourse + '?p=13' },
  'hw-5': { name: '韦东山 · 字节序与位操作（25 分钟）', url: embeddedHalCourse + '?p=16' },
  'hw-6': { name: '韦东山 · 芯片封装与引脚（14 分钟）', url: embeddedHalCourse + '?p=9' },
  'hw-7': { name: '韦东山 · 使用 HAL 库点灯（19 分钟）', url: embeddedHalCourse + '?p=11' },
  'hw-8': { name: '韦东山 · 按键控制 LED（19 分钟）', url: embeddedHalCourse + '?p=19' },
} as const

export type EmbeddedIntroId = keyof typeof embeddedIntroVideos

function isEmbeddedIntro(taskId: string): taskId is EmbeddedIntroId {
  return Object.hasOwn(embeddedIntroVideos, taskId)
}

export function embeddedIntroVideo(taskId: string) {
  return isEmbeddedIntro(taskId) ? embeddedIntroVideos[taskId] : undefined
}

export function embeddedLessonId(taskId: EmbeddedIntroId) {
  return 'study-embedded-' + taskId
}

const hardwareIdsByTitle = new Map(Object.entries(studyPilotTitles)
  .filter(([id]) => id.startsWith('hw-')).map(([id, title]) => [title, id]))

export function embeddedGuideHref(taskId: string | undefined) {
  if (!taskId?.startsWith('hw-')) return undefined
  if (isEmbeddedIntro(taskId)) return '#' + embeddedLessonId(taskId)
  const number = Number(taskId.slice(3))
  if (!Number.isInteger(number) || number < 1 || number > 24) return undefined
  if (number <= 14) return '#' + embeddedGuideSections.stm32
  if (number >= 19 && number <= 21) return '#' + embeddedGuideSections.rtos
  return '#' + (number === 24 ? embeddedGuideSections.pcb : embeddedGuideSections.project)
}

export function embeddedGuideHrefForTitle(title: string) {
  return embeddedGuideHref(hardwareIdsByTitle.get(title))
}
