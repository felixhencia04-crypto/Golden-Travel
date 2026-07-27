import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().createUser({
  email: 'admin@goldentravel.com',
  password: 'password123',
})
  .then((userRecord) => {
    console.log('Successfully created new user:', userRecord.uid);
    process.exit(0);
  })
  .catch((error) => {
    console.log('Error creating new user:', error);
    process.exit(1);
  });
