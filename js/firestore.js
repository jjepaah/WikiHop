import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAW2ZuYIJdPXQVyYnHYqS3ZdHa5OIEI9b4",
    authDomain: "wikihop-game.firebaseapp.com",
    projectId: "wikihop-game",
    storageBucket: "wikihop-game.firebasestorage.app",
    messagingSenderId: "287351342114",
    appId: "1:287351342114:web:cde2b5e285ccb81ede767b",
    measurementId: "G-YH7NT8DZSZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.saveRandomScore = async function({
    player,
    clicks,
    timeMs,
    startPage,
    targetPage
}) {
    await addDoc(collection(db, "leaderboard_random"), {
    player,
    clicks,
    timeMs,
    startPage,
    targetPage,
    date: new Date()
    });
}

window.getRandomLeaderboard = async function() {
    const q = query(collection(db, "leaderboard_random"), orderBy("clicks", "asc"), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
}