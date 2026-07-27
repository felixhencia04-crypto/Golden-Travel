import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
initializeApp({projectId: "test"});
const auth = getAuth();
auth.verifyIdToken("undefined").catch(e => console.log(e.message));
auth.verifyIdToken("null").catch(e => console.log(e.message));
