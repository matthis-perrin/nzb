const path = require('path');
const child_process = require('child_process');
const fs = require('fs');

const terraformPath = path.join(process.cwd(), 'terraform');

function runCommand(opts) {
  const {command, cwd, env} = opts;
  console.log('-----------------------------------------');
  console.log(`Running: \`${command}\``);
  console.log('-----------------------------------------');
  child_process.execSync(command, {cwd, env, stdio: 'inherit'});
}

function ensureDistFolders(projects) {
  for (const {dist, isLambda} of projects) {
    try {
      fs.accessSync(dist);
    } catch {
      fs.mkdirSync(dist);
    }
    if (isLambda) {
      const files = fs.readdirSync(dist);
      if (files.length === 0) {
        fs.writeFileSync(
          path.join(dist, 'index.js'),
          `exports.handler = async function() {return ''};`
        );
      }
    }
  }
}

function checkTerraformCredentials() {
  const credentialsPath = path.join(terraformPath, '.aws-credentials');
  try {
    fs.accessSync(credentialsPath);
  } catch {
    throw new Error(
      `Missing AWS credential files at "${credentialsPath}"\nTo use your current credentials with this project run:\ncp ~/.aws/credentials ${credentialsPath}`
    );
  }
}

function terraformOutputs() {
  return JSON.parse(
    child_process.execSync(`terraform output -json`, {cwd: terraformPath}).toString()
  );
}

const sharedPath = path.join(process.cwd(), 'shared');
const sharedDist = path.join(sharedPath, 'dist');
const nzb_nzbsuPath = path.join(process.cwd(), 'nzb_nzbsu');
const nzb_nzbsuDist = path.join(nzb_nzbsuPath, 'dist');
const nzb_tmdbPath = path.join(process.cwd(), 'nzb_tmdb');
const nzb_tmdbDist = path.join(nzb_tmdbPath, 'dist');
const nzb_nzbget_daemonPath = path.join(process.cwd(), 'nzb_nzbget_daemon');
const nzb_nzbget_daemonDist = path.join(nzb_nzbget_daemonPath, 'dist');
const nzb_frontendPath = path.join(process.cwd(), 'nzb_frontend');
const nzb_frontendDist = path.join(nzb_frontendPath, 'dist');
const nzb_backendPath = path.join(process.cwd(), 'nzb_backend');
const nzb_backendDist = path.join(nzb_backendPath, 'dist');

async function buildShared(outputs) {
  runCommand({
    command: `yarn build`,
    cwd: sharedPath,
  });
}

async function buildStandaloneLambda_nzb_nzbsu(outputs) {
  runCommand({command: 'rm -rf dist', cwd: nzb_nzbsuPath});
  runCommand({
    command: `yarn build`,
    cwd: nzb_nzbsuPath,
  });
  runCommand({
    command: `yarn install --modules-folder dist/node_modules --production --no-bin-links`,
    cwd: nzb_nzbsuPath,
  });
}

async function buildStandaloneLambda_nzb_tmdb(outputs) {
  runCommand({command: 'rm -rf dist', cwd: nzb_tmdbPath});
  runCommand({
    command: `yarn build`,
    cwd: nzb_tmdbPath,
  });
  runCommand({
    command: `yarn install --modules-folder dist/node_modules --production --no-bin-links`,
    cwd: nzb_tmdbPath,
  });
}

async function buildNodeScript_nzb_nzbget_daemon(outputs) {
  runCommand({
    command: `yarn build`,
    cwd: nzb_nzbget_daemonPath,
  });
}

async function buildWebApp_nzb_frontend(outputs) {
  // Build the "nzb_frontend" frontend
  runCommand({
    command: `yarn build`,
    cwd: nzb_frontendPath,
    env: {
      ...process.env,
      PUBLIC_PATH: `https://${outputs.nzb_frontend_cloudfront_domain_name.value}`,
    },
  });
  const INDEX_HTML = fs.readFileSync(path.join(nzb_frontendDist, 'index.html')).toString();

  // Build the "nzb_backend" backend
  runCommand({command: 'rm -rf dist', cwd: nzb_backendPath});
  runCommand({
    command: `yarn build`,
    cwd: nzb_backendPath,
    env: {...process.env, MATTHIS_INDEX_HTML: JSON.stringify(INDEX_HTML)},
  });
  runCommand({
    command: `yarn install --modules-folder dist/node_modules --production --no-bin-links`,
    cwd: nzb_backendPath,
  });
}

async function buildWorkspace(outputs) {
  await Promise.all([
    buildShared(outputs),
    buildStandaloneLambda_nzb_nzbsu(outputs),
    buildStandaloneLambda_nzb_tmdb(outputs),
    buildNodeScript_nzb_nzbget_daemon(outputs),
    buildWebApp_nzb_frontend(outputs),
  ]);
}

async function run() {
  // Initialize if needed and get terraform outputs
  ensureDistFolders([
    {dist: sharedDist},
    {dist: nzb_nzbsuDist, isLambda: true},
    {dist: nzb_tmdbDist, isLambda: true},
    {dist: nzb_nzbget_daemonDist},
    {dist: nzb_frontendDist},
    {dist: nzb_backendDist, isLambda: true},
  ]);
  let outputs = terraformOutputs();
  if (Object.keys(outputs).length === 0) {
    checkTerraformCredentials();
    runCommand({command: `terraform init`, cwd: terraformPath});
    runCommand({command: `terraform apply -auto-approve`, cwd: terraformPath});
    outputs = terraformOutputs();
  }

  // Build the projects
  await buildWorkspace(outputs);

  // Terraform
  runCommand({command: `terraform apply -auto-approve`, cwd: terraformPath});
  console.log('Done');
}

run()
  .catch(err => console.error(err))
  .catch(() => process.exit(13));

