import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { appendFileSync } from 'node:fs'

const password = process.env.APP_PASSWORD
if (!password) {
  console.log('APP_PASSWORD nicht gesetzt: Seite wird ohne Passwortabfrage gebaut.')
  process.exit(0)
}
const salt = randomBytes(16).toString('hex')
const hash = pbkdf2Sync(password, salt, 250000, 32, 'sha256').toString('hex')
const lines = `VITE_PASSWORD_SALT=${salt}\nVITE_PASSWORD_HASH=${hash}\n`
if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, lines)
else process.stdout.write(lines)
console.log('Passwortabfrage aktiviert.')
