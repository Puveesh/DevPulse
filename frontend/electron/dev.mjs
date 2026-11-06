delete process.env.ELECTRON_RUN_AS_NODE;
import { spawn } from 'node:child_process';

const child = spawn('npx', ['electron-vite', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

