import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const auth = getAuth(app);

// Current user state
let currentUser = null;

// Initialize authentication
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Load username from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            currentUser = {
                ...user,
                username: userDoc.data().username
            };
            console.log("User signed in:", currentUser.username);
            if (window.updateUserUI) {
                window.updateUserUI(currentUser);
            }
        } else {
            currentUser = user;
        }
    } else {
        currentUser = null;
        console.log("User signed out");
        if (window.updateUserUI) {
            window.updateUserUI(null);
        }
    }
});

// Check if username is available
window.checkUsernameAvailable = async function(username) {
    try {
        const usernameDoc = await getDoc(doc(db, "usernames", username.toLowerCase()));
        return !usernameDoc.exists();
    } catch (error) {
        console.error("Error checking username:", error);
        return false;
    }
}

// Register new user with username and password
window.registerUser = async function(username, password) {
    try {
        // Check if username is available
        const isAvailable = await window.checkUsernameAvailable(username);
        if (!isAvailable) {
            return { success: false, error: "Username already taken" };
        }
        
        // Create email from username (username@wikihop.local)
        const email = `${username.toLowerCase()}@wikihop.local`;
        
        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        
        // Store username mapping (username -> userId)
        await setDoc(doc(db, "usernames", username.toLowerCase()), {
            userId: userId,
            email: email,
            createdAt: new Date()
        });
        
        // Store user data (userId -> username)
        await setDoc(doc(db, "users", userId), {
            username: username,
            email: email,
            createdAt: new Date()
        });
        
        currentUser = {
            ...userCredential.user,
            username: username
        };
        
        return { success: true, user: currentUser };
    } catch (error) {
        console.error("Error registering user:", error);
        let errorMessage = error.message;
        if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters';
        } else if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Username already taken';
        }
        return { success: false, error: errorMessage };
    }
}

// Login with username and password
window.loginUser = async function(username, password) {
    try {
        // Get email from username
        const usernameDoc = await getDoc(doc(db, "usernames", username.toLowerCase()));
        if (!usernameDoc.exists()) {
            return { success: false, error: "Username not found" };
        }
        
        const email = usernameDoc.data().email;
        
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        
        // Get username
        const userDoc = await getDoc(doc(db, "users", userId));
        const storedUsername = userDoc.data().username;
        
        currentUser = {
            ...userCredential.user,
            username: storedUsername
        };
        
        return { success: true, user: currentUser };
    } catch (error) {
        console.error("Error logging in:", error);
        let errorMessage = error.message;
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid username or password';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'Username not found';
        }
        return { success: false, error: errorMessage };
    }
}

// Get current user's username
window.getCurrentUsername = function() {
    if (currentUser && currentUser.username) {
        return currentUser.username;
    }
    return null;
}

// Sign out
window.signOutUser = async function() {
    try {
        await signOut(auth);
        currentUser = null;
        return { success: true };
    } catch (error) {
        console.error("Error signing out:", error);
        return { success: false, error: error.message };
    }
}

window.saveRandomScore = async function({
    player,
    clicks,
    timeMs,
    startPage,
    targetPage,
    wikiLang = "en",
    challengedFrom = null
}) {
    await addDoc(collection(db, "leaderboard_random"), {
    player,
    clicks,
    timeMs,
    startPage,
    targetPage,
    wikiLang,
    challengedFrom,
    isChallenged: false,
    date: new Date()
    });
}

window.getRandomLeaderboard = async function() {
    const q = query(collection(db, "leaderboard_random"), orderBy("clicks", "asc"), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

window.saveTimedScore = async function({
    player,
    clicks,
    startPage,
    targetPage,
    timeLeft,
    wikiLang = "en",
    challengedFrom = null
}) {
    await addDoc(collection(db, "leaderboard_timed"), {
        player,
        clicks,
        startPage,
        targetPage,
        timeLeft,
        wikiLang,
        challengedFrom,
        isChallenged: false,
        date: new Date()
    });
}

window.getTimedLeaderboard = async function() {
    const q = query(collection(db, "leaderboard_timed"), orderBy("timeLeft", "desc"), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Check if user has already challenged a specific route
window.hasUserChallengedRoute = async function(mode, player, startPage, targetPage) {
    const collectionName = mode === "random" ? "leaderboard_random" : "leaderboard_timed";
    const q = query(
        collection(db, collectionName),
        where("player", "==", `${player} - challenge`),
        where("startPage", "==", startPage),
        where("targetPage", "==", targetPage)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

// Mark an entry as challenged
window.markEntryChallenged = async function(mode, entryId) {
    const collectionName = mode === "random" ? "leaderboard_random" : "leaderboard_timed";
    await setDoc(doc(db, collectionName, entryId), { isChallenged: true }, { merge: true });
}