const { spawn } = require('child_process');

function run(cmd, args, name) {
  const p = spawn(cmd, args, { stdio: ['inherit', 'pipe', 'pipe'], shell: true });

  p.stdout.on('data', (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });
  p.stderr.on('data', (data) => {
    process.stderr.write(`[${name} ERROR] ${data}`);
  });

  p.on('close', (code) => {
    console.log(`[${name}] exited with code ${code}`);
  });

  return p;
}

console.log('Starting backend and frontend...');

// Backend: node dev-server.js .env
const backend = run('node', ['dev-server.js', '.env'], 'backend');

// Frontend: use npx ng serve (uses local Angular CLI)
const frontend = run('npx', ['ng', 'serve', '--port', '4200'], 'frontend');

function shutdown() {
  console.log('Shutting down processes...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
