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
                html += `<div class="player-details collapsed">`;
                html += `<div class="route-info"><strong>Start:</strong> ${score.startPage || 'N/A'}</div>`;
                html += `<div class="route-info"><strong>Target:</strong> ${score.targetPage || 'N/A'}</div>`;
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
                html += `<div class="player-details collapsed">`;
                html += `<div class="route-info"><strong>Start:</strong> ${score.startPage || 'N/A'}</div>`;
                html += `<div class="route-info"><strong>Target:</strong> ${score.targetPage || 'N/A'}</div>`;
                html += `</div>`;
                html += `</td>`;
                html += `<td>${score.clicks}</td>`;
                html += `<td>${timeLeft}s</td>`;
                html += `</tr>`;
            });
        }
        
        html += '</tbody></table>';
        leaderboardContent.innerHTML = html;
        
        // Add click handlers to rows
        document.querySelectorAll('.leaderboard-row').forEach(row => {
            row.addEventListener('click', function() {
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
