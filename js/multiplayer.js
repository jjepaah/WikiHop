// Firebase
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { doc, setDoc, onSnapshot, getDoc, serverTimestamp, collection, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { db } from "./firebase.js";

// Create anonymous user
const auth = getAuth();
await signInAnonymously(auth);

// Buttons / UI
const createPartyBtn = document.getElementById("create-party-btn");
const joinPartyBtn = document.getElementById("join-party-btn");
const partyCodeEl = document.getElementById("party-code");
const partyLobbyModal = document.getElementById("party-lobby-modal");
const startHeader = document.getElementById("start-header");

// lobby listeners
let unsubscribePlayers = null;
let unsubscribeParty = null;
let localStartedAt = null;
let startPartyBtn = null;
let leavePartyBtn = null;

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

async function startParty(partyCode) {
    const partyRef = doc(db, "parties", partyCode);
    const startPage = (document.getElementById("start-menu") || {}).value || "";
    const targetPage = (document.getElementById("target-menu") || {}).value || "";
    const wikiLang = (document.getElementById("wiki-lang") || {}).value || "en";

    await updateDoc(partyRef, {
        status: "started",
        startPage,
        targetPage,
        wikiLang,
        startedAt: serverTimestamp()
    });
}

// Setup lobby UI & listeners (shared for host & joiners)
async function openPartyLobby(code) {
    const partyRef = doc(db, "parties", code);

    partyCodeEl.textContent = code;
    startHeader.textContent = "WikiHop - Party Lobby";
    partyLobbyModal.style.display = "flex";
    partyLobbyModal.classList.add("visible");
    partyLobbyModal.classList.remove("hidden");

    // expose current party code for other helpers
    try { window.CURRENT_PARTY = code; } catch (e) {}

    // fetch party once to know the host
    let partySnap = null;
    try {
        partySnap = await getDoc(partyRef);
    } catch (e) {
        console.error("Failed to fetch party:", e);
    }
    const partyData = partySnap && partySnap.exists() ? partySnap.data() : null;

    // create start button only for host (do not create for others)
    if (partyData && partyData.hostUid === auth.currentUser.uid) {
        if (!startPartyBtn) {
            startPartyBtn = document.createElement("button");
            startPartyBtn.textContent = "Start Party";
            startPartyBtn.style.marginTop = "8px";
            startPartyBtn.addEventListener("click", async () => {
                await startParty(code);
            });
            partyLobbyModal.appendChild(startPartyBtn);
        } else {
            if (!partyLobbyModal.contains(startPartyBtn)) partyLobbyModal.appendChild(startPartyBtn);
            startPartyBtn.style.display = "inline-block";
        }
    } else {
        if (startPartyBtn && partyLobbyModal.contains(startPartyBtn)) {
            startPartyBtn.remove();
            startPartyBtn = null;
        }
    }

    // create a Leave Party button for everyone (only one instance)
    if (!leavePartyBtn) {
        leavePartyBtn = document.createElement("button");
        leavePartyBtn.textContent = "Leave Party";
        leavePartyBtn.style.marginTop = "8px";
        leavePartyBtn.addEventListener("click", async () => {
            await leaveParty();
        });
    }
    if (!partyLobbyModal.contains(leavePartyBtn)) partyLobbyModal.appendChild(leavePartyBtn);

    // For joiners: disable all start-menu controls and only show party code.
    // For host: keep menu available (but hide create/join/start as before).
    try {
        const startBox = document.getElementById("start-box");
        const startBtn = document.getElementById("start-game-btn");
        const createBtn = document.getElementById("create-party-btn");

        const isHost = partyData && partyData.hostUid === auth.currentUser.uid;

        if (startBox) {
            Array.from(startBox.children).forEach(child => {
                // keep the party lobby element visible for everyone
                if (child.id === "party-lobby-modal") {
                    child.style.display = "flex";
                    return;
                }

                // host sees normal menu; joiners see only party code
                child.style.display = isHost ? "" : "none";
            });
        }

        // additionally toggle individual buttons for clarity
        if (isHost) {
            if (joinPartyBtn) joinPartyBtn.style.display = "none";
            if (startBtn) startBtn.style.display = "none";
            if (createBtn) createBtn.style.display = "none";
        } else {
            if (joinPartyBtn) joinPartyBtn.style.display = "none";
            if (startBtn) startBtn.style.display = "none";
            if (createBtn) createBtn.style.display = "none";
        }
    } catch (e) {
        console.warn("Could not toggle start/join/create UI:", e);
    }


// Leave party locally: unsubscribe, clear hooks, restore UI and return to start modal
async function leaveParty() {
    try {
        if (unsubscribePlayers) {
            try { unsubscribePlayers(); } catch (e) {}
            unsubscribePlayers = null;
        }
        if (unsubscribeParty) {
            try { unsubscribeParty(); } catch (e) {}
            unsubscribeParty = null;
        }
    } catch (e) {
        console.warn("Error unsubscribing from party listeners:", e);
    }

    try {
        // remove player document from party in Firestore (if present)
        try {
            const code = window.CURRENT_PARTY;
            const uid = auth.currentUser && auth.currentUser.uid;
            if (code && uid) {
                await deleteDoc(doc(db, "parties", code, "players", uid));

                // if no players left, delete the party document as well
                try {
                    const playersSnap = await getDocs(collection(db, "parties", code, "players"));
                    if (!playersSnap || playersSnap.empty) {
                        await deleteDoc(doc(db, "parties", code));
                    }
                } catch (e) {
                    console.warn("Failed to check/delete empty party:", e);
                }
            }
        } catch (e) {
            console.warn("Failed to remove player doc from party:", e);
        }

        // clear global party hooks
        if (window.onLocalWin) window.onLocalWin = null;
        if (window.CURRENT_PARTY) window.CURRENT_PARTY = null;
    } catch (e) {}

    // hide lobby modal
    try {
        partyLobbyModal.classList.remove("visible");
        partyLobbyModal.classList.add("hidden");
        partyLobbyModal.style.display = "none";
    } catch (e) {}

    // restore start-box UI and main buttons
    try {
        const startBox = document.getElementById("start-box");
        if (startBox) Array.from(startBox.children).forEach(child => child.style.display = "");
    } catch (e) {}

    try {
        const startBtn = document.getElementById("start-game-btn");
        const createBtn = document.getElementById("create-party-btn");
        const joinBtn = document.getElementById("join-party-btn");
        if (startBtn) startBtn.style.display = "";
        if (createBtn) createBtn.style.display = "";
        if (joinBtn) joinBtn.style.display = "";
    } catch (e) {}

    // show start modal
    try { startModal.style.display = "flex"; } catch (e) {}
}
    // players list listener
    if (unsubscribePlayers) unsubscribePlayers();
    unsubscribePlayers = listenToPartyPlayers(code, players => {
        console.log("Party players:", players);
        // TODO: render players into lobby UI
    });

    // party meta listener: ensure host-only start button and react to started state
    if (unsubscribeParty) unsubscribeParty();
    unsubscribeParty = listenToParty(code, party => {
        console.log("Party data:", party);

        // ensure button exists only for host
        if (party.hostUid === auth.currentUser.uid) {
            if (!startPartyBtn) {
                startPartyBtn = document.createElement("button");
                startPartyBtn.textContent = "Start Game";
                startPartyBtn.style.marginTop = "8px";
                startPartyBtn.addEventListener("click", async () => {
                    await startParty(code);
                });
                partyLobbyModal.appendChild(startPartyBtn);
            }
            startPartyBtn.style.display = "inline-block";
        } else {
            if (startPartyBtn && partyLobbyModal.contains(startPartyBtn)) {
                startPartyBtn.remove();
                startPartyBtn = null;
            }
        }

        // when party is started -> trigger local game start (only once)
        if (party.status === "started" && party.startedAt) {
            let startedMillis = null;
            try {
                startedMillis = party.startedAt.toMillis();
            } catch {
                startedMillis = party.startedAt && party.startedAt.seconds ? party.startedAt.seconds * 1000 : null;
            }

            if (startedMillis && startedMillis !== localStartedAt) {
                localStartedAt = startedMillis;

                // use shared game logic instead of clicking UI
                try {
                    if (window.startGameFromParty) {
                        window.startGameFromParty({
                            startPage: party.startPage,
                            targetPage: party.targetPage,
                            wikiLang: party.wikiLang,
                            mode: party.mode
                        }).catch(e => console.error("startGameFromParty failed:", e));
                    } else {
                        // fallback: apply party settings to inputs and click start button
                        if (party.wikiLang) {
                            const langSel = document.getElementById("wiki-lang");
                            if (langSel) langSel.value = party.wikiLang;
                        }
                        if (party.startPage) {
                            const startInput = document.getElementById("start-menu");
                            if (startInput) startInput.value = party.startPage;
                        }
                        if (party.targetPage) {
                            const targetInput = document.getElementById("target-menu");
                            if (targetInput) targetInput.value = party.targetPage;
                        }

                        const startBtn = document.getElementById("start-game-btn");
                        if (startBtn) startBtn.click();
                    }
                } catch (e) {
                    console.error("Failed to auto-start local game from party:", e);
                }
            }
        }
    });
}

//----------------------------------------------
// Event listeners
//----------------------------------------------

createPartyBtn.addEventListener("click", async () => {
    const playerName = prompt("Enter your name:") || "Anonymous";
    const wikiLang = typeof getWikiLang === "function" ? getWikiLang() : (document.getElementById("wiki-lang") || {}).value || "en";
    
    const code = await createParty(playerName, wikiLang);
    await openPartyLobby(code);
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

    await openPartyLobby(code);
});