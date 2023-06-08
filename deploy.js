import {execSync} from 'child_process';
import {randomUUID} from 'crypto';
import {accessSync, readFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

const terraformPath = join(process.cwd(), 'terraform');

function checkTerraformCredentials() {
  const credentialsPath = join(terraformPath, '.aws-credentials');
  try {
    accessSync(credentialsPath);
  } catch {
    throw new Error(
      `Missing AWS credential files at "${credentialsPath}"
To use your current credentials with this project run:
cp ~/.aws/credentials ${credentialsPath}`
    );
  }
}

function terraformOutputs() {
  const res = JSON.parse(execSync(`terraform output -json`, {cwd: terraformPath}).toString());
  return Object.fromEntries(Object.entries(res).map(([key, obj]) => [key, obj.value]));
}

function getProjects() {
  const projects = JSON.parse(readFileSync('app.code-workspace').toString()).projects;
  if (!Array.isArray(projects)) {
    throw new Error('No projects in the workspace');
  }
  return projects;
}

async function run() {
  // Build
  execSync(`yarn build`, {stdio: 'inherit'});

  // Get terraform outputs
  checkTerraformCredentials();
  let outputs = terraformOutputs();
  if (Object.keys(outputs).length === 0) {
    throw new Error('You must run "terraform apply" to deploy the infrastructure first');
  }
  const {region, code_bucket} = outputs;

  // Deploy each projects
  const projects = getProjects();
  const lambdaProjects = projects.map(p => p.lambdaName).filter(Boolean);
  for (const lambdaName of lambdaProjects) {
    console.log(`Deploying ${lambdaName}`);
    const tmp = tmpdir();
    const zipPath = join(tmp, randomUUID()) + '.zip';
    execSync(`pushd ${lambdaName}/dist; zip -r ${zipPath} *`);
    execSync(
      `AWS_CONFIG_FILE=terraform/.aws-credentials aws s3 cp ${zipPath} s3://${code_bucket}/${lambdaName}/dist.zip`
    );
    execSync(
      `AWS_CONFIG_FILE=terraform/.aws-credentials aws lambda update-function-code --function-name ${
        outputs[`${lambdaName}_function_name`]
      } --s3-bucket ${code_bucket} --s3-key ${lambdaName}/dist.zip --region ${region} --publish --no-cli-pager`
    );
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
