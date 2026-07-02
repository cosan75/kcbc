// CLAUDE.md / 스킬.md 파싱 결과 타입

export interface Pillar {
  name: string
  meaning: string
  question: string
}

export interface FlowStep {
  num: number
  ko: string
  en: string
  desc: string
  star?: boolean
}

export interface LessonCase {
  subject: string
  unit: string
  knowledgeType: '명제적' | '절차적'
  studentImage: string
  values: string[]
  macroLens: string
  microConcepts: string
  skills: string[]
  task: string
  generalization: string
}

export interface QuestionItem {
  no: number
  type: '서술형' | '논술형'
  domain: string
  title: string
  materialLabel: string
  materialDesc: string
  totalScore: number
  subScores: number[]
}

export interface KCBCData {
  pillars: Pillar[]
  steps: FlowStep[]
  lessons: { propositional: LessonCase; procedural: LessonCase }
  questions: QuestionItem[]
  checklist: string[]
}
