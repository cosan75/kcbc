// 마크다운을 ?raw 로 import 해서 빌드타임에 파싱
import claudeMdRaw from '../../CLAUDE.md?raw'
import skillMdRaw from '../../스킬.md?raw'

import { parsePillars, parseSteps, parseLessons, parseChecklist } from './parseClaudeMd'
import { parseQuestions } from './parseSkillMd'
import type { KCBCData } from '../types'

export function loadKCBCData(): KCBCData {
  return {
    pillars: parsePillars(claudeMdRaw),
    steps: parseSteps(claudeMdRaw),
    lessons: parseLessons(claudeMdRaw),
    questions: parseQuestions(skillMdRaw),
    checklist: parseChecklist(claudeMdRaw),
  }
}
