/**
 * KCBC 대시보드 — 체크리스트 상태 저장용 Apps Script 웹앱
 *
 * 📌 배포 상태 (2026-06-27)
 * - scriptId:      1wrSbKzylLbTQPLUCKdOO_TcXKbBdv6cvR1lOnGbpBeoWFHtNwqR4EPE8
 * - deployment:    AKfycbxm-cLjQ1eYRMAlMVObjl63gZaSXVJywlpqINP2cU9om1rRl6ga1h1JB_yGyJhoT2o0xQ
 * - 웹앱 URL:      https://script.google.com/macros/s/AKfycbxm-cLjQ1eYRMAlMVObjl63gZaSXVJywlpqINP2cU9om1rRl6ga1h1JB_yGyJhoT2o0xQ/exec
 * - .env.local:    VITE_SHEETS_WEBAPP_URL 에 위 URL 저장됨
 *
 * ⚠ 완전 동작하려면 사용자가 해줘야 할 것:
 * 1. Google Sheets 새 시트 생성 → 'checklist' 탭 추가 → 첫 행에 헤더:
 *      A: userId   B: checkId   C: checked   D: updatedAt
 * 2. 시트 URL 의 SPREADSHEET_ID 부분(/d/.../edit) 을 아래 상수에 붙여넣기
 * 3. 로컬에서: cd C:\Users\user\kcbc\apps-script && clasp push
 * 4. 새 deployment 만들기 (선택): clasp create-deployment
 * 5. kcbc 앱 새로고침 → 갤러리 체크리스트가 시트로 sync 됨
 */

const SPREADSHEET_ID = '1JUSmh14ak40PVW3OyJ6jbZIdFecCbWc2UXWqaaBLUXA'
const SHEET_NAME = 'checklist'

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sh = ss.getSheetByName(SHEET_NAME)
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME)
    sh.appendRow(['userId', 'checkId', 'checked', 'updatedAt'])
  }
  return sh
}

function loadState_(userId) {
  const sh = getSheet_()
  const last = sh.getLastRow()
  if (last < 2) return {}
  const values = sh.getRange(2, 1, last - 1, 3).getValues()
  const state = {}
  for (const [uid, cid, ch] of values) {
    if (String(uid) === String(userId)) {
      state[String(cid)] = Boolean(ch)
    }
  }
  return state
}

function saveState_(userId, state) {
  const sh = getSheet_()
  const last = sh.getLastRow()
  if (last >= 2) {
    // 해당 user 행 모두 삭제 후 재기록 (간단·견고)
    const values = sh.getRange(2, 1, last - 1, 4).getValues()
    const keep = values.filter((r) => String(r[0]) !== String(userId))
    sh.getRange(2, 1, last - 1, 4).clearContent()
    if (keep.length) {
      sh.getRange(2, 1, keep.length, 4).setValues(keep)
    }
  }
  const now = new Date().toISOString()
  const rows = Object.entries(state).map(([cid, ch]) => [userId, cid, !!ch, now])
  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 4).setValues(rows)
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function doGet(e) {
  const action = e.parameter.action
  const userId = e.parameter.userId || 'default'
  try {
    if (action === 'load') {
      return jsonOut_({ ok: true, state: loadState_(userId) })
    }
    return jsonOut_({ ok: false, error: 'unknown action' })
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) })
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    const action = body.action
    const userId = body.userId || 'default'
    if (action === 'save') {
      saveState_(userId, body.state || {})
      return jsonOut_({ ok: true })
    }
    return jsonOut_({ ok: false, error: 'unknown action' })
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) })
  }
}
