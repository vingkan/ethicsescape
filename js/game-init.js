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
        clueId: 'shue',
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
        clueId: 'bentham',
        type: 'puzzle',
        description: 'Requires advisor assessment',
        requires: null // Always visible, but puzzle requires advisor
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
        clueId: 'steinhoff',
        type: 'puzzle',
        description: 'Unlocked after Bentham',
        requires: 'bentham'
    },
    {
        id: 'records-file',
        icon: '📑',
        label: 'Historical Records',
        clueId: 'historical-records',
        type: 'puzzle',
        description: 'Unlocked after Steinhoff',
        requires: 'steinhoff'
    },
    {
        id: 'intervening-doc',
        icon: '📄',
        label: 'Intervening Action',
        clueId: 'intervening-action',
        type: 'puzzle',
        description: 'Unlocked after records',
        requires: 'historical-records'
    },
    {
        id: 'pamphlet-doc',
        icon: '📰',
        label: 'AFF Pamphlet',
        clueId: 'pamphlet',
        type: 'code',
        description: 'Unlocked after intervening',
        requires: 'intervening-action'
    }
];

let timerInterval = null;

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
    
    // Ensure Dirty Harry location persists after reload if the clue is already unlocked
    if (GameState.isClueUnlocked('dirty-harry')) {
        const hasDirtyHarry = discoveryLocations.some(location => location.clueId === 'dirty-harry');
        if (!hasDirtyHarry) {
            discoveryLocations.push({
                id: 'dirty-harry-trigger',
                icon: '🎬',
                label: 'Dirty Harry Scenario',
                clueId: 'dirty-harry',
                type: 'puzzle',
                description: 'Write a scenario based on your chosen form'
            });
        }
    }
    
    discoveryLocations.forEach(location => {
        // Check if location should be visible (requirements met)
        // Exception: bentham is always visible even if advisor not unlocked
        const isBentham = location.clueId === 'bentham';
        
        // Skip location if it has unmet requirements (except bentham which is always shown)
        if (!isBentham) {
            if (location.requires && !GameState.isClueUnlocked(location.requires)) {
                return; // Skip this location
            }
        }
        // Bentham is always included regardless of advisor status
        // Steinhoff requires bentham to be unlocked (not just viewed)
        
        const item = document.createElement('div');
        item.className = 'discovery-item';
        item.id = `discovery-${location.id}`;
        
        // Check if already discovered
        if (GameState.isClueUnlocked(location.clueId)) {
            item.classList.add('discovered');
        }
        
        // Special styling for bentham if advisor not unlocked
        if (isBentham && !GameState.isClueUnlocked('advisor')) {
            item.style.opacity = '0.8';
            item.style.borderStyle = 'dashed';
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
    // Check requirements (except for bentham which shows a message instead)
    if (location.requires && !GameState.isClueUnlocked(location.requires) && location.clueId !== 'bentham') {
        // Show message in clue viewer instead of alert
        const viewer = document.getElementById('clue-viewer');
        if (viewer) {
            viewer.innerHTML = `
                <div class="clue-header">
                    <h2>Requirements Not Met</h2>
                </div>
                <div class="clue-content">
                    <p>You need to unlock other clues first.</p>
                </div>
            `;
        }
        return;
    }
    
    // Animate
    UI.animateClueDiscovery(document.getElementById(`discovery-${location.id}`));
    
    const clue = ClueSystem.getClue(location.clueId);
    if (!clue) return;
    
    // Check if can unlock (except for bentham which always shows)
    if (!ClueSystem.canUnlock(location.clueId) && location.clueId !== 'bentham') {
        // Show message in clue viewer instead of alert
        const viewer = document.getElementById('clue-viewer');
        if (viewer) {
            viewer.innerHTML = `
                <div class="clue-header">
                    <h2>Requirements Not Met</h2>
                </div>
                <div class="clue-content">
                    <p>You need to unlock other clues first.</p>
                </div>
            `;
        }
        return;
    }
    
    // Handle different types
    if (location.type === 'document') {
        // Load and show document
        const content = await ClueSystem.loadClueContent(location.clueId);
        GameState.unlockClue(location.clueId);
        UI.showClue(location.clueId, content);
        UI.updateClueCount();
        
        // Mark as discovered
        const item = document.getElementById(`discovery-${location.id}`);
        if (item) item.classList.add('discovered');
        
    } else if (location.type === 'code') {
        // Show code input or document
        if (GameState.isClueUnlocked(location.clueId)) {
            // Already unlocked, just show it
            const content = await ClueSystem.loadClueContent(location.clueId);
            UI.showClue(location.clueId, content);
        } else {
            // For advisor, show special message about secure connection
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
        // Show puzzle
        if (location.clueId === 'bentham') {
            Puzzles.showBenthamScales();
        } else if (location.clueId === 'steinhoff') {
            Puzzles.showSteinhoffMatching();
        } else if (location.clueId === 'historical-records') {
            Puzzles.showHistoricalRecords();
        } else if (location.clueId === 'intervening-action') {
            Puzzles.showInterveningAction();
        } else if (location.clueId === 'dirty-harry') {
            Puzzles.showDirtyHarry();
        }
        
        // Don't unlock or mark as discovered here - puzzles unlock when completed
        // The checkmark will appear after the puzzle is completed and setupDiscoveryLocations is called
        
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
            <div class="postit-note" id="shue-postit">
                <div class="postit-content">
                    <strong>Note:</strong> Check the file cabinet for a paper by Henry Shue. The document is from 1978.
                </div>
            </div>
        </div>
    `;
    
    UI.showPuzzle('mdos-chart', html);
    GameState.unlockClue('mdos-chart');
    UI.updateClueCount();
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
function triggerDirtyHarry() {
    if (!GameState.isClueUnlocked('dirty-harry')) {
        // Add Dirty Harry to discovery locations
        const dirtyHarryLocation = {
            id: 'dirty-harry-trigger',
            icon: '🎬',
            label: 'Dirty Harry Scenario',
            clueId: 'dirty-harry',
            type: 'puzzle',
            description: 'Write a scenario based on your chosen form'
        };
        
        discoveryLocations.push(dirtyHarryLocation);
        setupDiscoveryLocations();
        
        // Notification is handled by modal in UI.js, no alert needed
    }
}

// Make functions globally available
window.handleDiscoveryClick = handleDiscoveryClick;
window.Puzzles = Puzzles;
window.UI = UI;
window.showFormSelection = showFormSelection;
window.triggerDirtyHarry = triggerDirtyHarry;
window.setupDiscoveryLocations = setupDiscoveryLocations;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initGame);

// Handle page visibility changes to sync timer
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateTimerDisplay();
    }
});
