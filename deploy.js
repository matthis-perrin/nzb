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
          path.join(dist, 'main.js'),
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

const nzb_registryPath = path.join(process.cwd(), 'nzb_registry');
const nzb_registryDist = path.join(nzb_registryPath, 'dist');
const nzb_checkerPath = path.join(process.cwd(), 'nzb_checker');
const nzb_checkerDist = path.join(nzb_checkerPath, 'dist');
const nzb_backfillPath = path.join(process.cwd(), 'nzb_backfill');
const nzb_backfillDist = path.join(nzb_backfillPath, 'dist');

async function buildStandaloneLambda_nzb_registry(outputs) {
  runCommand({command: 'rm -rf dist', cwd: nzb_registryPath});
  runCommand({
    command: `yarn build`,
    cwd: nzb_registryPath,
  });
  runCommand({
    command: `yarn install --modules-folder dist/node_modules --production --no-bin-links`,
    cwd: nzb_registryPath,
  });
}

async function buildStandaloneLambda_nzb_checker(outputs) {
  runCommand({command: 'rm -rf dist', cwd: nzb_checkerPath});
  runCommand({
    command: `yarn build`,
    cwd: nzb_checkerPath,
  });
  runCommand({
    command: `yarn install --modules-folder dist/node_modules --production --no-bin-links`,
    cwd: nzb_checkerPath,
  });
}

async function buildStandaloneLambda_nzb_backfill(outputs) {
  runCommand({command: 'rm -rf dist', cwd: nzb_backfillPath});
  runCommand({
    command: `yarn build`,
    cwd: nzb_backfillPath,
  });
  runCommand({
    command: `yarn install --modules-folder dist/node_modules --production --no-bin-links`,
    cwd: nzb_backfillPath,
  });
}

async function buildWorkspace(outputs) {
  await Promise.all([
    buildStandaloneLambda_nzb_registry(outputs),
    buildStandaloneLambda_nzb_checker(outputs),
    buildStandaloneLambda_nzb_backfill(outputs),
  ]);
}

async function run() {
  // Initialize if needed and get terraform outputs
  ensureDistFolders([
    {dist: nzb_registryDist, isLambda: true},
    {dist: nzb_checkerDist, isLambda: true},
    {dist: nzb_backfillDist, isLambda: true},
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

