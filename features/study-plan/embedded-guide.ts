import { studyPilotTitles } from '@/features/study-records/study-pilot-titles'

export const embeddedGuideSections = {
  basics: 'study-embedded-basics',
  stm32: 'study-embedded-stm32',
  project: 'study-embedded-project',
  rtos: 'study-embedded-rtos',
  pcb: 'study-embedded-pcb',
} as const

const hardwareIdsByTitle = new Map(Object.entries(studyPilotTitles)
  .filter(([id]) => id.startsWith('hw-')).map(([id, title]) => [title, id]))

export function embeddedGuideHref(taskId: string | undefined) {
  if (!taskId?.startsWith('hw-')) return undefined
  const number = Number(taskId.slice(3))
  if (!Number.isInteger(number) || number < 1 || number > 24) return undefined
  if (number <= 5) return '#' + embeddedGuideSections.basics
  if (number <= 14) return '#' + embeddedGuideSections.stm32
  if (number >= 19 && number <= 21) return '#' + embeddedGuideSections.rtos
  return '#' + (number === 24 ? embeddedGuideSections.pcb : embeddedGuideSections.project)
}

export function embeddedGuideHrefForTitle(title: string) {
  return embeddedGuideHref(hardwareIdsByTitle.get(title))
}
