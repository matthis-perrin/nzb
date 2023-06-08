import {join} from 'path';
import {execSync, exec} from 'child_process';
import {readdir} from 'fs/promises';

//

function detectYarn() {
  try {
    const yarnVersion = execSync('yarn -v', {stdio: ['ignore', 'pipe', 'ignore']}).toString();
    if (!yarnVersion.split('\n')[0].match(/^\d+.\d+.\d+$/)) {
      return `Invalid yarn version "${yarnVersion}"`;
    }
  } catch (err) {
    return 'Yarn is not installed';
  }
}

function detectTerraform() {
  try {
    const terraformVersion = execSync('terraform -v', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    if (!terraformVersion.split('\n')[0].match(/^Terraform v\d+.\d+.\d+$/)) {
      return `Invalid terraform version "${terraformVersion}"`;
    }
  } catch (err) {
    return 'Terraform is not installed';
  }
}

function requirementDetection() {
  const errors = [detectYarn(), detectTerraform()].filter(err => typeof err === 'string');
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    return false;
  }
  return true;
}

//

async function installNodeModulesAtPath(path) {
  return new Promise((resolve, reject) => {
    exec(
      `yarn install --check-files --audit --non-interactive --ignore-optional`,
      {cwd: path},
      (error, stdout, stderr) => {
        if (!error) {
          resolve();
        } else {
          console.error(`Failure to run \`yarn install\` at "${path}"\n${stderr}`);
          reject();
        }
      }
    );
  });
}

async function installNodeModules() {
  const root = process.cwd();
  const rootEnt = await readdir(root, {withFileTypes: true});
  const dirs = await Promise.all(
    rootEnt
      .filter(ent => ent.isDirectory() && ent.name !== 'node_modules')
      .map(async ent => {
        const files = await readdir(join(root, ent.name));
        const hasPackageJson = files.includes('package.json');
        return {name: ent.name, hasPackageJson};
      })
  );
  const dirsToInstall = dirs.filter(d => d.hasPackageJson).map(d => d.name);
  await Promise.all([
    installNodeModulesAtPath(root),
    ...dirsToInstall.map(dir => installNodeModulesAtPath(join(root, dir))),
  ]);
}

async function run() {
  console.log('Checking requirements...');
  if (!requirementDetection()) {
    throw 'requirementDetection failure';
  }
  console.log('Installing node_modules...');
  await installNodeModules();
  console.log('Done');
}

run()
  .catch(err => {
    console.error(err);
    console.log('Fix the issue then run `node setup.js` manually');
  })
  .catch(() => process.exit(13));
