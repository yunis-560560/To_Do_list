import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPmuSwdd_9FytfqgUMMt1geQgML50xL0Q",
  authDomain: "to-do-list-27df6.firebaseapp.com",
  projectId: "to-do-list-27df6",
  storageBucket: "to-do-list-27df6.firebasestorage.app",
  messagingSenderId: "458762556296",
  appId: "1:458762556296:web:cf5f4716cdff8ce17e203d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testSignup() {
  try {
    const email = "test2_" + Date.now() + "@example.com";
    console.log("Attempting to create user:", email);
    const result = await createUserWithEmailAndPassword(auth, email, "Test@1234");
    console.log("Success Auth! UID:", result.user.uid);
    
    console.log("Attempting Firestore setDoc...");
    await setDoc(doc(db, 'users', result.user.uid), {
      name: "Test User",
      gender: "Male"
    });
    console.log("Success Firestore!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.code, error.message);
    process.exit(1);
  }
}

testSignup();
