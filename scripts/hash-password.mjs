// Usage: node scripts/hash-password.mjs <password>
// Prints the PBKDF2 hash to put in USER_HASH_<USER> (Vercel env vars / .env.local).
import { pbkdf2Sync } from 'node:crypto'

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs <password>')
  process.exit(1)
}
console.log(pbkdf2Sync(password, 'meu-dashboard-v1-salt-2026', 200_000, 32, 'sha256').toString('hex'))
