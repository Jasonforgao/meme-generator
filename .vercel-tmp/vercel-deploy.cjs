#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
const ALLOWED_COMMANDS = new Set(['vercel', 'npm', 'pnpm', 'yarn']);
function log(msg) { console.error(msg); }
function commandExists(cmd) {
  if (!ALLOWED_COMMANDS.has(cmd)) throw new Error(`Command not in whitelist: ${cmd}`);
  try {
    if (isWindows) return spawnSync('where', [cmd], { stdio: 'ignore' }).status === 0;
    else return spawnSync('sh', ['-c', `command -v ""`, '--', cmd], { stdio: 'ignore' }).status === 0;
  } catch { return false; }
}
function getCommandOutput(cmd, args) {
  try {
    const result = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: isWindows });
    return result.status === 0 ? (result.stdout || '').trim() : null;
  } catch { return null; }
}
function doDeploy(projectPath) {
  log('Starting deployment...');
  const args = ['--yes', '--prod'];
  log(`Executing: vercel ${args.join(' ')} in ${projectPath}`);
  log('========================================');
  try {
    const result = spawnSync('vercel', args, {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
      timeout: 300000,
      shell: isWindows
    });
    const output = (result.stdout || '') + (result.stderr || '');
    log(output);
    if (result.status !== 0) throw new Error('Deployment failed');
    const aliasedMatch = output.match(/Aliased:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const deploymentMatch = output.match(/Production:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const urlMatch = output.match(/(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/);
    const finalUrl = aliasedMatch?.[1] || deploymentMatch?.[1] || urlMatch?.[1];
    log('========================================');
    log('Deployment successful!');
    if (finalUrl) {
      log(`Your site is live: ${finalUrl}`);
      console.log(JSON.stringify({ status: 'success', url: finalUrl }));
    } else {
      console.log(JSON.stringify({ status: 'success', message: 'Deployed' }));
    }
  } catch (error) {
    log(error.message);
    process.exit(1);
  }
}
function main() {
  log('========================================');
  log('Vercel Deployment');
  log('========================================');
  const projectPath = process.argv[2] || '.';
  const absPath = path.resolve(projectPath);
  log(`Project: ${absPath}`);
  if (!fs.existsSync(absPath)) { log('Error: Project not found'); process.exit(1); }
  doDeploy(absPath);
}
main();
