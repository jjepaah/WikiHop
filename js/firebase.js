// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAW2ZuYIJdPXQVyYnHYqS3ZdHa5OIEI9b4",
    authDomain: "wikihop-game.firebaseapp.com",
    projectId: "wikihop-game",
    storageBucket: "wikihop-game.firebasestorage.app",
    messagingSenderId: "287351342114",
    appId: "1:287351342114:web:cde2b5e285ccb81ede767b",
    measurementId: "G-YH7NT8DZSZ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
