/**
 * Yerel geliştirme: Vite + /api serverless (vercel dev).
 * package.json "dev" script'i doğrudan "vercel dev" içeremez (recursive invocation).
 */
import { spawn } from 'node:child_process'

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vercel', 'dev', '--listen', '3000'],
  { stdio: 'inherit', shell: true, cwd: process.cwd() },
)

child.on('exit', (code) => process.exit(code ?? 0))
