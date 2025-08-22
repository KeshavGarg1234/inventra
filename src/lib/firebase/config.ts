
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

// Hardcoded Firebase configuration as provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyDTLcGIPYqDvkGduzaMoWyPIFAs6QyfEAk",
  authDomain: "inventra-fzobb.firebaseapp.com",
  databaseURL: "https://inventra-fzobb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventra-fzobb",
  storageBucket: "inventra-fzobb.appspot.com",
  messagingSenderId: "741114750894",
  appId: "1:741114750894:web:caa49144a94f04f5da8a3f"
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  // Initialize the Firebase app with the provided configuration.
  return initializeApp(firebaseConfig);
}

const app: FirebaseApp = getFirebaseApp();
const db: Database = getDatabase(app);
const auth: Auth = getAuth(app);

export { app, db, auth, firebaseConfig };
