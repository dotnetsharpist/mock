// Which greeting mascot to show. The profile has no gender field, so it is read
// from the patronymic and the surname, where Uzbek and Russian mark it:
// "Akmal qizi" / "Akmalovna", "Karimova" for a girl; "Akmal o'g'li" /
// "Akmalovich", "Karimov" for a boy. Patronymic first: it is the clearer signal.
// ponytail: suffix heuristic; replace with a real profile field once the API has one.

const FEMALE_FATHER = /(qizi|kizi|qiziy|ovna|evna|ivna|кизи|қизи|овна|евна|ична|инична)$/i
const MALE_FATHER = /(o['‘’`ʻ]?g['‘’`ʻ]?li|ugli|ўғли|угли|ович|евич|ич|ovich|evich|ich)$/i
const FEMALE_SURNAME = /(ova|eva|yeva|ina|aya|ова|ева|ина|ая)$/i
const MALE_SURNAME = /(ov|ev|yev|in|iy|ов|ев|ин|ий)$/i

export function guessGender(info) {
  const father = String(info?.fatherName || '').trim()
  const surname = String(info?.lastName || '').trim()

  if (FEMALE_FATHER.test(father)) return 'female'
  if (MALE_FATHER.test(father)) return 'male'
  if (FEMALE_SURNAME.test(surname)) return 'female'
  if (MALE_SURNAME.test(surname)) return 'male'
  return null
}

// Run with `node src/utils/mascot.js` to check the rules.
if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('mascot.js')) {
  const cases = [
    [{ fatherName: 'Akmal qizi' }, 'female'],
    [{ fatherName: "Akmal o'g'li" }, 'male'],
    [{ fatherName: 'Akmal o‘g‘li' }, 'male'],
    [{ fatherName: 'Акмаловна' }, 'female'],
    [{ fatherName: 'Akmalovich' }, 'male'],
    [{ lastName: 'Karimova' }, 'female'],
    [{ lastName: 'Karimov' }, 'male'],
    [{ lastName: 'Каримова' }, 'female'],
    [{ fatherName: 'Akmal', lastName: 'Toshpo‘lat' }, null],
  ]
  for (const [info, expected] of cases) {
    const got = guessGender(info)
    if (got !== expected) throw new Error(`${JSON.stringify(info)}: expected ${expected}, got ${got}`)
  }
  console.log('mascot: ok')
}
