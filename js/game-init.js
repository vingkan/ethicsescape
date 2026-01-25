/**
 * Game initialization and main game loop
 */

// Initialize UI
UI.init();

// Discovery locations configuration
const discoveryLocations = [
    {
        id: 'briefing',
        icon: '📋',
        label: 'Mission Briefing',
        clueId: 'briefing',
        type: 'document'
    },
    {
        id: 'mdos-chart',
        icon: '📺',
        label: 'MDOS Decision Matrix',
        clueId: 'mdos-chart',
        type: 'special'
    },
    {
        id: 'file-cabinet-shue',
        icon: '🗄️',
        label: 'File Cabinet Drawer',
        clueId: 'shue-essay',
        type: 'code',
        description: 'Classified documents - requires code'
    },
    {
        id: 'secure-pager',
        icon: '📱',
        label: 'Secure Pager',
        clueId: 'advisor',
        type: 'code',
        description: 'Receive advisor transmission'
    },
    {
        id: 'bentham-worksheet',
        icon: '📊',
        label: 'Bentham\'s Scales Worksheet',
        clueId: 'bentham-scales',
        type: 'puzzle', // Always accessible, not code-locked
        description: 'Quantify the threat assessment'
    },
    {
        id: 'manila-folder-a',
        icon: '📁',
        label: 'Authorization Form A',
        clueId: 'form-a',
        type: 'document',
        description: 'Enhanced Interrogation'
    },
    {
        id: 'briefcase-b',
        icon: '💼',
        label: 'Authorization Form B',
        clueId: 'form-b',
        type: 'document',
        description: 'Psychologist Discussion'
    },
    {
        id: 'steinhoff-folder',
        icon: '📂',
        label: 'Steinhoff Definitions',
        clueId: 'steinhoff-definitions',
        type: 'code', // Changed to code type since it's code-locked
        description: 'Requires code to unlock'
    },
    {
        id: 'records-file',
        icon: '📑',
        label: 'Historical Records',
        clueId: 'historical-records',
        type: 'code', // Changed to code type since it's code-locked
        description: 'Requires code to unlock'
    },
    {
        id: 'intervening-doc',
        icon: '📄',
        label: 'Intervening Action',
        clueId: 'intervening-action',
        type: 'code', // Changed to code type since it's code-locked
        description: 'Requires code to unlock'
    },
    {
        id: 'pamphlet-doc',
        icon: '📰',
        label: 'AFF Pamphlet',
        clueId: 'pamphlet',
        type: 'code',
        description: 'Requires code to unlock'
    }
];

let timerInterval = null;

function updatePostItVisibility() {
    // Update secure-pager-code post-it visibility
    const pagerPostit = document.getElementById('pager-postit');
    if (pagerPostit) {
        if (GameState.hasClueAccess('secure-pager-code')) {
            pagerPostit.style.display = '';
            // Set initial opacity to 0.75 if not viewed yet
            const viewedClues = GameState.getViewedClues();
            if (!viewedClues.includes('secure-pager-code')) {
                pagerPostit.style.opacity = '0.75';
                pagerPostit.style.cursor = 'pointer';
                // Add click handler
                pagerPostit.onclick = function() {
                    GameState.unlockClue('secure-pager-code');
                    GameState.viewClue('secure-pager-code');
                    pagerPostit.style.opacity = '1.0';
                    pagerPostit.style.cursor = 'default';
                    UI.updateClueCount();
                    pagerPostit.onclick = null; // Remove handler after first click
                };
            } else {
                pagerPostit.style.opacity = '1.0';
            }
        } else {
            pagerPostit.style.display = 'none';
        }
    }
    
    // Update shue-post-it visibility (in MDOS chart if it's shown)
    const shuePostit = document.getElementById('shue-postit');
    if (shuePostit) {
        if (GameState.hasClueAccess('shue-post-it')) {
            shuePostit.style.display = '';
            // Set initial opacity to 0.75 if not viewed yet
            const viewedClues = GameState.getViewedClues();
            if (!viewedClues.includes('shue-post-it')) {
                shuePostit.style.opacity = '0.75';
                shuePostit.style.cursor = 'pointer';
                // Add click handler
                shuePostit.onclick = function() {
                    GameState.unlockClue('shue-post-it');
                    GameState.viewClue('shue-post-it');
                    shuePostit.style.opacity = '1.0';
                    shuePostit.style.cursor = 'default';
                    UI.updateClueCount();
                    shuePostit.onclick = null; // Remove handler after first click
                };
            } else {
                shuePostit.style.opacity = '1.0';
            }
        } else {
            shuePostit.style.display = 'none';
        }
    }
}

async function initGame() {
    // Check if game should be initialized or resumed
    const wasInProgress = GameState.init();
    
    if (!wasInProgress) {
        // New game - start timer
        GameState.startNewGame();
    }
    
    // Initialize UI
    UI.updateClueCount();
    
    // Start timer
    startTimer();
    
    // Load initial content
    await loadInitialContent();
    
    // Update post-it note visibility (before setupDiscoveryLocations to ensure it's set)
    updatePostItVisibility();
    
    // Setup discovery locations
    setupDiscoveryLocations();
    
    // Configure submit button and initial view based on completion state
    if (GameState.isGameCompleted()) {
        // Completed game: allow players to go directly to the form selection
        showFormSelection();
    } else {
        // In-progress game: show submit button to open form selection
        const submitBtn = document.getElementById('submit-form-btn');
        if (submitBtn) {
            submitBtn.style.display = 'block';
            submitBtn.textContent = 'Submit Authorization Form';
        }
    }
}

async function loadInitialContent() {
    // Always show briefing
    if (GameState.isClueUnlocked('briefing')) {
        const briefingContent = await ClueSystem.loadClueContent('briefing');
        UI.showClue('briefing', briefingContent);
    }
}

function setupDiscoveryLocations() {
    const grid = document.getElementById('discovery-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Ensure Dirty Harry location is added if player has access (not just when unlocked)
    if (GameState.hasClueAccess('dirty-harry')) {
        const hasDirtyHarry = discoveryLocations.some(location => location.clueId === 'dirty-harry');
        if (!hasDirtyHarry) {
            discoveryLocations.push({
                id: 'dirty-harry-trigger',
                icon: '🎬',
                label: 'Dirty Harry Scenario',
                clueId: 'dirty-harry',
                type: 'code', // Changed to code type since it's code-locked
                description: 'Write a scenario based on your chosen form'
            });
        }
    }
    
    discoveryLocations.forEach(location => {
        // Check if current player has access to this clue
        // Always show briefing and mdos-chart (available to all players)
        const alwaysAvailable = location.clueId === 'briefing' || location.clueId === 'mdos-chart';
        if (!alwaysAvailable && !GameState.hasClueAccess(location.clueId)) {
            return; // Skip this location - player doesn't have access
        }
        
        // All player-accessible clues are now visible, regardless of unlock status
        // No requirement checks - clues are visible but code-locked
        
        const item = document.createElement('div');
        item.className = 'discovery-item';
        item.id = `discovery-${location.id}`;
        
        // Check if already discovered/unlocked
        if (GameState.isClueUnlocked(location.clueId)) {
            item.classList.add('discovered');
        }
        
        item.innerHTML = `
            <div class="discovery-icon">${location.icon}</div>
            <div class="discovery-label">${location.label}</div>
            ${location.description ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">${location.description}</div>` : ''}
        `;
        
        item.addEventListener('click', () => handleDiscoveryClick(location));
        grid.appendChild(item);
    });
}

async function handleDiscoveryClick(location) {
    // Animate
    UI.animateClueDiscovery(document.getElementById(`discovery-${location.id}`));
    
    const clue = ClueSystem.getClue(location.clueId);
    if (!clue) return;
    
    // Check if clue is already unlocked
    const isUnlocked = GameState.isClueUnlocked(location.clueId);
    
    // Handle different types
    if (location.type === 'document') {
        if (isUnlocked) {
            // Already unlocked, just show it
            const content = await ClueSystem.loadClueContent(location.clueId);
            UI.showClue(location.clueId, content);
        } else {
            // Documents are always unlocked when clicked (no code needed)
            const content = await ClueSystem.loadClueContent(location.clueId);
            GameState.unlockClue(location.clueId);
            UI.showClue(location.clueId, content);
            UI.updateClueCount();
            setupDiscoveryLocations();
        }
        
    } else if (location.type === 'code') {
        // Show code input or document
        if (isUnlocked) {
            // Check if this is a puzzle-type clue (by ID)
            const puzzleClues = ['steinhoff-definitions', 'bentham-scales', 'dirty-harry', 'historical-records', 'intervening-action'];
            if (puzzleClues.includes(location.clueId)) {
                // Show puzzle directly
                if (location.clueId === 'bentham-scales') {
                    Puzzles.showBenthamScales();
                } else if (location.clueId === 'steinhoff-definitions') {
                    Puzzles.showSteinhoffMatching();
                } else if (location.clueId === 'historical-records') {
                    Puzzles.showHistoricalRecords();
                } else if (location.clueId === 'intervening-action') {
                    Puzzles.showInterveningAction();
                } else if (location.clueId === 'dirty-harry') {
                    Puzzles.showDirtyHarry();
                }
            } else {
                // Document-type clue: load and show content
                const content = await ClueSystem.loadClueContent(location.clueId);
                UI.showClue(location.clueId, content);
            }
        } else {
            // Locked - show code input
            if (location.clueId === 'advisor') {
                const viewer = document.getElementById('clue-viewer');
                if (viewer) {
                    viewer.innerHTML = `
                        <div class="clue-header">
                            <h2>Secure Pager Connection</h2>
                        </div>
                        <div class="code-input-container">
                            <p>Establish secure connection to receive advisor transmission.</p>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 1rem 0;">
                                <em>Enter the connection code to receive the transmission.</em>
                            </p>
                            <input type="text" id="code-input" placeholder="Enter connection code" autocomplete="off" maxlength="10">
                            <button onclick="UI.submitCode('${location.clueId}')">Establish Connection</button>
                            <p id="code-error" class="error-message" style="display:none;"></p>
                        </div>
                    `;
                    
                    const input = document.getElementById('code-input');
                    if (input) {
                        input.focus();
                        input.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter') {
                                UI.submitCode(location.clueId);
                            }
                        });
                    }
                }
            } else {
                UI.showCodeInput(location.clueId);
            }
        }
        
    } else if (location.type === 'puzzle') {
        // Puzzle-type clues: bentham-scales is always accessible (not code-locked)
        // Other puzzles: if unlocked, show puzzle; if locked, show code input
        if (location.clueId === 'bentham-scales') {
            // bentham-scales is always accessible, no code needed
            Puzzles.showBenthamScales();
        } else if (isUnlocked) {
            // Show puzzle for unlocked code-locked puzzles
            if (location.clueId === 'steinhoff-definitions') {
                Puzzles.showSteinhoffMatching();
            } else if (location.clueId === 'historical-records') {
                Puzzles.showHistoricalRecords();
            } else if (location.clueId === 'intervening-action') {
                Puzzles.showInterveningAction();
            } else if (location.clueId === 'dirty-harry') {
                Puzzles.showDirtyHarry();
            }
        } else {
            // Locked - show code input for code-locked puzzles
            UI.showCodeInput(location.clueId);
        }
        
    } else if (location.type === 'special') {
        // Special handling
        if (location.clueId === 'mdos-chart') {
            showMDOSChart();
        }
    }
}

function showMDOSChart() {
    const html = `
        <div class="mdos-chart-container">
            <h2>MDOS Decision Matrix</h2>
            <p>The following questions introduce dimensions of the ethical debate:</p>
            <div class="mdos-chart">
                <!-- Row 1: Questions -->
                <div class="chart-cell question">Is enhanced interrogation justified if the threat may be fake?</div>
                <div class="chart-cell question">Is enhanced interrogation justified even if it may not work?</div>
                <div class="chart-cell question">Is enhanced interrogation justified if someone else performs it?</div>

                <!-- Row 2: Yes answers and clues -->
                <div class="chart-cell">
                    <div class="mdos-answer-label yes">Yes</div>
                    <div class="mdos-answer-clue">Bentham</div>
                </div>
                <div class="chart-cell">
                    <div class="mdos-answer-label yes">Yes</div>
                    <div class="mdos-answer-clue">Steinhoff</div>
                </div>
                <div class="chart-cell">
                    <div class="mdos-answer-label yes">Yes</div>
                    <div class="mdos-answer-clue">Intervening Action</div>
                </div>

                <!-- Row 3: No answers and clues -->
                <div class="chart-cell">
                    <div class="mdos-answer-label no">No</div>
                    <div class="mdos-answer-clue">Shue</div>
                </div>
                <div class="chart-cell">
                    <div class="mdos-answer-label no">No</div>
                    <div class="mdos-answer-clue">Pamphlet</div>
                </div>
                <div class="chart-cell">
                    <div class="mdos-answer-label no">No</div>
                    <div class="mdos-answer-clue">Dirty Harry</div>
                </div>
            </div>
            <p style="margin-top: 1rem; color: var(--text-secondary);">
                These questions hint at the existence of clues that relate to each question.
            </p>
            ${GameState.hasClueAccess('shue-post-it') ? `
            <div class="postit-note" id="shue-postit" style="opacity: ${GameState.getViewedClues().includes('shue-post-it') ? '1.0' : '0.75'}; cursor: ${GameState.getViewedClues().includes('shue-post-it') ? 'default' : 'pointer'};">
                <div class="postit-content">
                    <strong>Note:</strong> Check the file cabinet for a paper by Henry Shue. The document is from 1978.
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    UI.showPuzzle('mdos-chart', html);
    GameState.unlockClue('mdos-chart');
    UI.updateClueCount();
    // Refresh discovery locations to show checkmark
    setupDiscoveryLocations();
    
    // Set up click handler for shue-post-it if it exists and hasn't been viewed
    setTimeout(() => {
        const shuePostit = document.getElementById('shue-postit');
        if (shuePostit && !GameState.getViewedClues().includes('shue-post-it')) {
            shuePostit.onclick = function() {
                GameState.unlockClue('shue-post-it');
                GameState.viewClue('shue-post-it');
                shuePostit.style.opacity = '1.0';
                shuePostit.style.cursor = 'default';
                UI.updateClueCount();
                shuePostit.onclick = null; // Remove handler after first click
            };
        }
    }, 100);
}

function startTimer() {
    // Update immediately
    updateTimerDisplay();
    
    // Update every second
    timerInterval = setInterval(() => {
        const timerInfo = GameState.updateTimer();
        UI.updateTimer(timerInfo);
        
        // Check if expired
        if (timerInfo.expired) {
            clearInterval(timerInterval);
            handleTimeExpired();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerInfo = GameState.updateTimer();
    UI.updateTimer(timerInfo);
}

function handleTimeExpired() {
    // Disable clue discovery
    const discoveryItems = document.querySelectorAll('.discovery-item');
    discoveryItems.forEach(item => {
        item.style.pointerEvents = 'none';
        item.style.opacity = '0.5';
    });
    
    // Prompt player via modal to proceed to decision page
    if (typeof UI !== 'undefined' && typeof UI.showModal === 'function') {
        UI.showModal(
            'Decision Time',
            'Time is running out. You must now select an authorization form.',
            [
                {
                    text: 'Continue to Decision',
                    class: 'modal-button-primary',
                    onclick: 'UI.hideModal(); showFormSelection();'
                }
            ]
        );
    } else {
        // Fallback if modal is unavailable
        showFormSelection();
    }
}

function showFormSelection() {
    const forms = [];
    
    // Form A - always available
    forms.push({
        id: 'form-a',
        name: 'Form A: Enhanced Interrogation',
        preview: 'Authorizes enhanced interrogation techniques including physical measures and psychological pressure.'
    });
    
    // Form B - always available
    forms.push({
        id: 'form-b',
        name: 'Form B: Psychologist Discussion',
        preview: 'Authorizes a psychologist to engage in discussion with the subject. No physical force or lies permitted.'
    });
    
    // Form C - only if unlocked
    if (GameState.isClueUnlocked('custom-form')) {
        forms.push({
            id: 'form-c',
            name: 'Form C: Custom Authorization',
            preview: 'A custom authorization form that you created with your own permissions and rules.'
        });
    }
    
    UI.showFormSelection(forms);
}

// Function to trigger Dirty Harry clue (can be called when consensus detected)
// Note: Dirty Harry is now always visible to players who have access, so this function
// is mainly for ensuring it's in the discovery locations array
function triggerDirtyHarry() {
    if (GameState.hasClueAccess('dirty-harry')) {
        // Add Dirty Harry to discovery locations if not already there
        const hasDirtyHarry = discoveryLocations.some(location => location.clueId === 'dirty-harry');
        if (!hasDirtyHarry) {
            const dirtyHarryLocation = {
                id: 'dirty-harry-trigger',
                icon: '🎬',
                label: 'Dirty Harry Scenario',
                clueId: 'dirty-harry',
                type: 'code', // Changed to code type since it's code-locked
                description: 'Requires code to unlock'
            };
            
            discoveryLocations.push(dirtyHarryLocation);
            setupDiscoveryLocations();
        }
    }
}

// Make functions globally available
window.handleDiscoveryClick = handleDiscoveryClick;
window.Puzzles = Puzzles;
window.UI = UI;
window.showFormSelection = showFormSelection;
window.triggerDirtyHarry = triggerDirtyHarry;
window.setupDiscoveryLocations = setupDiscoveryLocations;
window.updatePostItVisibility = updatePostItVisibility;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);

// Handle page visibility changes to sync timer
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateTimerDisplay();
    }
});
