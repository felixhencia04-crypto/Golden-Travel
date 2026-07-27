import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import jwt from 'jsonwebtoken';
initializeApp({projectId: "test"});
const auth = getAuth();
const custom = jwt.sign({role: 'admin'}, 'secret');
auth.verifyIdToken(custom).catch(e => console.log(e.message));
