let currentMode = 'random'; // Track current leaderboard mode

// Load leaderboard based on mode
async function loadLeaderboard(mode = 'random') {
    currentMode = mode;
    const leaderboardContent = document.getElementById('leaderboard-content');
    
    try {
        let scores;
        if (mode === 'random') {
            scores = await window.getRandomLeaderboard();
        } else if (mode === 'timed') {
            scores = await window.getTimedLeaderboard();
        }
        
        if (scores.length === 0) {
            leaderboardContent.innerHTML = '<p>No scores yet. Be the first!</p>';
            return;
        }
        
        let html = '<table class="leaderboard-table">';
        
        if (mode === 'random') {
            html += '<thead><tr><th>#</th><th>Player</th><th>Clicks</th><th>Time</th></tr></thead>';
            html += '<tbody>';
            
            scores.forEach((score, index) => {
                const time = (score.timeMs / 1000).toFixed(2);
                html += `<tr class="leaderboard-row" data-index="${index}">`;
                html += `<td>${index + 1}</td>`;
                html += `<td class="player-cell">`;
                html += `<div class="player-name">${score.player || 'Anonymous'}</div>`;
                html += `<div class="player-details collapsed" data-entry-id="${score.id}" data-mode="${mode}" data-start="${score.startPage || ''}" data-target="${score.targetPage || ''}" data-wiki-lang="${score.wikiLang || 'en'}" data-original-player="${score.challengedFrom || score.player}">`;
                html += `<div class="route-info"><strong>Start:</strong> ${score.startPage || 'N/A'}</div>`;
                html += `<div class="route-info"><strong>Target:</strong> ${score.targetPage || 'N/A'}</div>`;
                html += `<div class="route-info"><strong>Wikipedia:</strong> ${(score.wikiLang || 'en').toUpperCase()}</div>`;
                if (score.challengedFrom) {
                    html += `<div class="route-info challenge-info"><strong>Challenged from:</strong> ${score.challengedFrom}</div>`;
                } else {
                    html += `<button class="challenge-btn" data-entry-id="${score.id}">Challenge This Route</button>`;
                }
                html += `</div>`;
                html += `</td>`;
                html += `<td>${score.clicks}</td>`;
                html += `<td>${time}s</td>`;
                html += `</tr>`;
            });
        } else if (mode === 'timed') {
            html += '<thead><tr><th>#</th><th>Player</th><th>Clicks</th><th>Time Left</th></tr></thead>';
            html += '<tbody>';
            
            scores.forEach((score, index) => {
                const timeLeft = score.timeLeft ? score.timeLeft.toFixed(2) : '0.00';
                html += `<tr class="leaderboard-row" data-index="${index}">`;
                html += `<td>${index + 1}</td>`;
                html += `<td class="player-cell">`;
                html += `<div class="player-name">${score.player || 'Anonymous'}</div>`;
                html += `<div class="player-details collapsed" data-entry-id="${score.id}" data-mode="${mode}" data-start="${score.startPage || ''}" data-target="${score.targetPage || ''}" data-wiki-lang="${score.wikiLang || 'en'}" data-original-player="${score.challengedFrom || score.player}">`;
                html += `<div class="route-info"><strong>Start:</strong> ${score.startPage || 'N/A'}</div>`;
                html += `<div class="route-info"><strong>Target:</strong> ${score.targetPage || 'N/A'}</div>`;
                html += `<div class="route-info"><strong>Wikipedia:</strong> ${(score.wikiLang || 'en').toUpperCase()}</div>`;
                if (score.challengedFrom) {
                    html += `<div class="route-info challenge-info"><strong>Challenged from:</strong> ${score.challengedFrom}</div>`;
                } else {
                    html += `<button class="challenge-btn" data-entry-id="${score.id}">Challenge This Route</button>`;
                }
                html += `</div>`;
                html += `</td>`;
                html += `<td>${score.clicks}</td>`;
                html += `<td>${timeLeft}s</td>`;
                html += `</tr>`;
            });
        }
        
        html += '</tbody></table>';
        leaderboardContent.innerHTML = html;
        
        // Add click handlers to rows to expand/collapse details
        document.querySelectorAll('.leaderboard-row').forEach(row => {
            row.addEventListener('click', function(e) {
                // Don't toggle if clicking the challenge button
                if (e.target.classList.contains('challenge-btn')) {
                    return;
                }
                
                const details = this.querySelector('.player-details');
                const wasExpanded = !details.classList.contains('collapsed');
                
                // Close all other expanded rows
                document.querySelectorAll('.player-details').forEach(d => {
                    d.classList.add('collapsed');
                });
                document.querySelectorAll('.leaderboard-row').forEach(r => r.classList.remove('expanded'));
                
                // Toggle this row
                if (!wasExpanded) {
                    this.classList.add('expanded');
                    details.classList.remove('collapsed');
                }
            });
        });
        
        // Add click handlers to challenge buttons
        document.querySelectorAll('.challenge-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                
                const details = this.closest('.player-details');
                const entryId = details.dataset.entryId;
                const mode = details.dataset.mode;
                const startPage = details.dataset.start;
                const targetPage = details.dataset.target;
                const wikiLang = details.dataset.wikiLang || 'en';
                const originalPlayer = details.dataset.originalPlayer;
                
                // Check if user is logged in
                const currentPlayer = window.getCurrentUsername();
                if (!currentPlayer && !window.isGuestMode) {
                    alert('Please log in to challenge a route!');
                    return;
                }
                
                // Check if user has already challenged this route
                const alreadyChallenged = await window.hasUserChallengedRoute(mode, currentPlayer || 'Guest', startPage, targetPage);
                if (alreadyChallenged) {
                    alert('You have already challenged this route!');
                    return;
                }
                
                // Store challenge metadata in sessionStorage
                sessionStorage.setItem('challengeData', JSON.stringify({
                    entryId,
                    mode,
                    startPage,
                    targetPage,
                    wikiLang,
                    originalPlayer
                }));
                
                // Start the challenge
                const startModal = document.getElementById('start-modal');
                const gamemodeSelect = document.getElementById('gamemode');
                const startPageInput = document.getElementById('start-menu');
                const targetPageInput = document.getElementById('target-menu');
                const langSelect = document.getElementById('wiki-lang');
                
                // Set wiki language first
                if (langSelect) {
                    langSelect.value = wikiLang;
                    if (typeof setWikiLang === 'function') {
                        setWikiLang(wikiLang);
                    }
                }
                
                // Use "set" mode but store the original mode for leaderboard saving
                gamemodeSelect.value = 'set';
                gamemodeSelect.dispatchEvent(new Event('change'));
                
                // Set up the game with explicit values
                startPageInput.value = startPage;
                targetPageInput.value = targetPage;
                
                console.log('Challenge starting with:', { startPage, targetPage, mode, wikiLang });
                
                // Trigger form submission after a small delay to ensure values are set
                const startForm = document.getElementById('start-form');
                setTimeout(() => {
                    try {
                        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                        startForm.dispatchEvent(submitEvent);
                        console.log('Challenge form submitted');
                    } catch (error) {
                        console.error('Error submitting challenge form:', error);
                    }
                }, 10);
            });
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardContent.innerHTML = '<p>Error loading leaderboard</p>';
    }
}

// Initialize tabs
function initializeTabs() {
    const tabs = document.querySelectorAll('.leaderboard-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            // Load the corresponding leaderboard
            const mode = this.getAttribute('data-mode');
            loadLeaderboard(mode);
        });
    });
}

// Load leaderboard when page loads
window.addEventListener('load', () => {
    initializeTabs();
    loadLeaderboard('random');
});

// Reload leaderboard when game ends (keep current mode)
window.reloadLeaderboard = () => loadLeaderboard(currentMode);
