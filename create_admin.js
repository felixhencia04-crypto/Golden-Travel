import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

createUserWithEmailAndPassword(auth, 'admin@goldentravel.com', 'admin123456')
  .then((userCredential) => {
    console.log("Admin user created successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error creating admin user:", error);
    process.exit(1);
  });
