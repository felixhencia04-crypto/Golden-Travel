import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

initializeApp({ projectId: config.projectId });

getAuth().createCustomToken('test-uid').then(token => console.log(token)).catch(e => console.error(e));
