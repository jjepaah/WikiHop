// Firebase
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import { doc, setDoc, onSnapshot, getDoc, serverTimestamp, collection, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import { db } from "./firebase.js";
// UI Elements
import { ui } from "./ui/uiElements.js";
// Gamemode registry
import { modeRegistry } from "./gamemodes/modeRegistry.js";

// Create anonymous user
const auth = getAuth();
await signInAnonymously(auth);

// lobby listeners
let unsubscribePlayers = null;
let unsubscribeParty = null;
let localStartedAt = null;
let startPartyBtn = null;
let leavePartyBtn = null;

/**
 * Initialize party gamemode dropdown with multiplayer modes
 * Uses the gamemode registry to get available multiplayer modes
 */
function initializeGamemodeDropdown() {
    const multiplayerModes = modeRegistry.getMultiplayerModes();
    ui.partyGamemodeSelect.innerHTML = "";
    multiplayerModes.forEach(mode => {
        const option = document.createElement("option");
        option.value = mode.id;
        option.textContent = mode.label;
        option.title = mode.description;
        ui.partyGamemodeSelect.appendChild(option);
    });
    ui.partyGamemodeSelect.value = "teamwork"; // Set default
}

// Initialize on load
initializeGamemodeDropdown();

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
    const gamemode = ui.partyGamemodeSelect.value || "teamwork";

    await setDoc(partyRef, {
        code,
        mode: "party",
        gamemode,
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

/**
 * Mark the party as finished (used in teamwork mode when any player wins)
 * This will trigger win modal for all players in the party
 */
export async function markPartyAsFinished(partyCode) {
    try {
        const partyRef = doc(db, "parties", partyCode);
        await updateDoc(partyRef, {
            finished: true,
            finishedAt: serverTimestamp()
        });
    } catch (e) {
        console.error("Failed to mark party as finished:", e);
    }
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

    ui.partyCodeEl.textContent = code;
    ui.startHeader.textContent = "WikiHop - Party Lobby";
    ui.partyLobbyModal.style.display = "flex";
    ui.partyLobbyModal.classList.add("visible");
    ui.partyLobbyModal.classList.remove("hidden");

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

    // Set gamemode dropdown to current party gamemode
    if (partyData && partyData.gamemode) {
        ui.partyGamemodeSelect.value = partyData.gamemode;
    }

    // Add listener for gamemode changes (only host can change)
    const handleGamemodeChange = async () => {
        if (partyData && partyData.hostUid === auth.currentUser.uid) {
            await updateDoc(partyRef, {
                gamemode: ui.partyGamemodeSelect.value
            });
        }
    };
    ui.partyGamemodeSelect.removeEventListener("change", handleGamemodeChange);
    ui.partyGamemodeSelect.addEventListener("change", handleGamemodeChange);

    // Get button container
    const buttonContainer = ui.partyLobbyModal.querySelector(".party-buttons");
    if (buttonContainer) {
        buttonContainer.innerHTML = ""; // Clear existing buttons
    }

    // create start button only for host (do not create for others)
    if (partyData && partyData.hostUid === auth.currentUser.uid) {
        if (!startPartyBtn) {
            startPartyBtn = document.createElement("button");
            startPartyBtn.textContent = "Start Game";
            startPartyBtn.addEventListener("click", async () => {
                await startParty(code);
            });
        }
        if (buttonContainer) buttonContainer.appendChild(startPartyBtn);
        // Enable gamemode dropdown for host
        ui.partyGamemodeSelect.disabled = false;
    } else {
        startPartyBtn = null;
        // Disable gamemode dropdown for non-host players
        ui.partyGamemodeSelect.disabled = true;
    }

    // create a Leave Party button for everyone
    if (!leavePartyBtn) {
        leavePartyBtn = document.createElement("button");
        leavePartyBtn.textContent = "Leave Party";
        leavePartyBtn.addEventListener("click", async () => {
            await leaveParty();
        });
    }
    if (buttonContainer) buttonContainer.appendChild(leavePartyBtn);

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
            if (ui.joinPartyBtn) ui.joinPartyBtn.style.display = "none";
            if (startBtn) startBtn.style.display = "none";
            if (createBtn) createBtn.style.display = "none";
        } else {
            if (ui.joinPartyBtn) ui.joinPartyBtn.style.display = "none";
            if (startBtn) startBtn.style.display = "none";
            if (createBtn) createBtn.style.display = "none";
        }
    } catch (e) {
        console.warn("Could not toggle start/join/create UI:", e);
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

        // Update gamemode dropdown if changed by host
        if (party.gamemode && party.gamemode !== ui.partyGamemodeSelect.value) {
            ui.partyGamemodeSelect.value = party.gamemode;
        }

        // ensure button exists only for host
        const buttonContainer = ui.partyLobbyModal.querySelector(".party-buttons");
        if (party.hostUid === auth.currentUser.uid) {
            if (!startPartyBtn) {
                startPartyBtn = document.createElement("button");
                startPartyBtn.textContent = "Start Game";
                startPartyBtn.addEventListener("click", async () => {
                    await startParty(code);
                });
            }
            if (buttonContainer && !buttonContainer.contains(startPartyBtn)) {
                buttonContainer.insertBefore(startPartyBtn, buttonContainer.firstChild);
            }
        } else {
            if (startPartyBtn && buttonContainer && buttonContainer.contains(startPartyBtn)) {
                startPartyBtn.remove();
            }
            startPartyBtn = null;
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
                            mode: party.mode,
                            partyCode: code,
                            gamemode: party.gamemode
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

        // In teamwork mode, if any player has finished, show win modal to everyone
        if (party.gamemode === "teamwork" && party.finished) {
            try {
                const winModal = document.getElementById("win-modal");
                if (winModal && winModal.classList.contains("hidden")) {
                    winModal.classList.remove("hidden");
                    console.log("Team reached the target!");
                }
            } catch (e) {
                console.warn("Could not show win modal:", e);
            }
        }
    });
}
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
        ui.partyLobbyModal.classList.remove("visible");
        ui.partyLobbyModal.classList.add("hidden");
        ui.partyLobbyModal.style.display = "none";
        ui.partyGamemodeSelect.disabled = false;
        ui.partyGamemodeSelect.value = "teamwork"; // Reset to default
        
        // Reset header title back to "WikiHop"
        ui.startHeader.textContent = "WikiHop";
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

//----------------------------------------------
// Event listeners
//----------------------------------------------

ui.createPartyBtn.addEventListener("click", async () => {
    const playerName = prompt("Enter your name:") || "Anonymous";
    const wikiLang = typeof getWikiLang === "function" ? getWikiLang() : (document.getElementById("wiki-lang") || {}).value || "en";
    
    const code = await createParty(playerName, wikiLang);
    await openPartyLobby(code);
});

ui.joinPartyBtn.addEventListener("click", async () => {
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