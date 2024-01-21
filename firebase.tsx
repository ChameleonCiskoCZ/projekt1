// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7DRrVpItqDEloyjtMNxsNEcInR8O24jg",
  authDomain: "projekt1-4215f.firebaseapp.com",
  projectId: "projekt1-4215f",
  storageBucket: "projekt1-4215f.appspot.com",
  messagingSenderId: "529597744973",
  appId: "1:529597744973:web:5add2941a2874db6ee1904"
};

// Initialize Firebase
let firebase_app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export default firebase_app;