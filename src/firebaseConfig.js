// Firebase configuration and initialization
// IMPORTANT: Paste your Realtime Database URL into the firebaseConfig below as
// databaseURL: 'https://<your-db>.firebaseio.com' OR pass it to getDatabase(app, url)

import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDjRhPyLKah8UZufysJXyd9qYBUZPi6yHw",
  authDomain: "educonsult-42431.firebaseapp.com",
  projectId: "educonsult-42431",
  storageBucket: "educonsult-42431.firebasestorage.app",
  messagingSenderId: "478199403613",
  appId: "1:478199403613:web:f92d4cd39d1618b68b69b4",
  measurementId: "G-0JP0ZDPDHD",
  databaseURL: "https://educonsult-42431-default-rtdb.firebaseio.com"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

export { db, auth }