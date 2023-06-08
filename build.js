import {resolve} from 'node:path';
import {runAllWebpacks} from '@matthis/webpack-runner';

runAllWebpacks({root: resolve('.'), watch: process.argv.includes('--watch')}).catch(console.error);
