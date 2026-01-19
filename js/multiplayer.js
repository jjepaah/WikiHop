// Firebase
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { doc, setDoc, onSnapshot, getDoc, serverTimestamp, collection } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { db } from "./firebase.js";

// Create anonymous user
const auth = getAuth();
await signInAnonymously(auth);

// Buttons
const createPartyBtn = document.getElementById("create-party-btn");
const joinPartyBtn = document.getElementById("join-party-btn");
const partyCodeEl = document.getElementById("party-code");
const partyLobbyModal = document.getElementById("party-lobby-modal");
const startHeader = document.getElementById("start-header");


//----------------------------------------------
// Multiplayer functions
//----------------------------------------------

function generatePartyCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createParty(playerName, wikiLang) {
    const code = generatePartyCode();
    const uid = auth.currentUser.uid;
    
    const partyRef = doc(db, "parties", code);

    await setDoc(partyRef, {
        code,
        mode: "party",
        wikiLang,
        status: "lobby",
        hostUid: uid,
        createdAt: serverTimestamp(),
    });

    // Add host as first player
    await setDoc(doc(partyRef, "players", uid), {
        name: playerName,
        clicks: 0,
        finished: false,
        createdAt: serverTimestamp()
    });

    return code;
}

async function joinParty(code, playerName) {
    const uid = auth.currentUser.uid;
    const partyRef = doc(db, "parties", code);

    const snap = await getDoc(partyRef);
    if (!snap.exists()) {
        throw new Error("Party not found.");
    }

    await setDoc(doc(partyRef, "players", uid), {
        name: playerName,
        clicks: 0,
        finished: false,
        createdAt: serverTimestamp()
    });

    return code;
}

function listenToPartyPlayers(code, onUpdate) {
    return onSnapshot(
        collection(db, "parties", code, "players"),
        snap => {
            const players = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            onUpdate(players);
        }
    );
}

export function listenToParty(partyCode, onPartyUpdate) {
    const partyRef = doc(db, "parties", partyCode);
    return onSnapshot(partyRef, snap => {
        if (!snap.exists()) return;
        onPartyUpdate(snap.data());
    });
}

//----------------------------------------------
// Event listeners
//----------------------------------------------

createPartyBtn.addEventListener("click", async () => {
    const playerName = prompt("Enter your name:") || "Anonymous";
    const wikiLang = getWikiLang();

    const code = await createParty(playerName, wikiLang);
    //alert(`Party created! Share this code with your friends to join: ${code}`);

    partyCodeEl.textContent = code;
    startHeader.textContent = "WikiHop - Party Lobby";
    partyLobbyModal.style.display = "flex";
    partyLobbyModal.classList.add("visible");
    partyLobbyModal.classList.remove("hidden");
});

joinPartyBtn.addEventListener("click", async () => {
    const raw = prompt("Enter party code:");
    const code = raw ? raw.trim().toUpperCase() : "";
    if (!code) return;

    const playerName = prompt("Enter your name:") || "Anonymous";
    try {
        await joinParty(code, playerName);
    } catch (err) {
        alert(err.message || "Failed to join party.");
        return;
    }

    partyCodeEl.textContent = code;
    startHeader.textContent = "WikiHop - Party Lobby";
    partyLobbyModal.style.display = "flex";
    partyLobbyModal.classList.add("visible");
    partyLobbyModal.classList.remove("hidden");
});