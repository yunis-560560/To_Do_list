import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "dummy-api-key",
  authDomain: "dummy-auth-domain",
  projectId: "dummy-project-id",
  storageBucket: "dummy-storage-bucket",
  messagingSenderId: "dummy-sender-id",
  appId: "dummy-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testSignup() {
  try {
    const email = "test@example.com";
    console.log("Attempting to create user with dummy config...");
    const result = await createUserWithEmailAndPassword(auth, email, "Test@1234");
    console.log("Success Auth! UID:", result.user.uid);
    process.exit(0);
  } catch (error) {
    console.error("Firebase Auth Error:", error.code, error.message);
    process.exit(1);
  }
}

testSignup();
