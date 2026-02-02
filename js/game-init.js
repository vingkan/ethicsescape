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
        label: 'Situation Briefing',
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
        icon: '📟',
        label: 'Secure Pager',
        clueId: 'advisor',
        type: 'code',
        description: 'Receive advisor transmission'
    },
    {
        id: 'bentham-worksheet',
        icon: '⚖️',
        label: 'Bentham Scales',
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

// Drag state for post-it notes
let dragState = {
    isDragging: false,
    element: null,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    hasMoved: false,
    wasDrag: false // Track if the last interaction was a drag
};

/**
 * Discover a clue from a post-it note (unlock and view)
 * This function handles the clue discovery logic shared between click and drag interactions
 */
function discoverPostItClue(element, clueId) {
    if (!element || !clueId) return;
    
    // Check if clue has already been viewed
    const viewedClues = GameState.getViewedClues();
    if (viewedClues.includes(clueId)) {
        return; // Already discovered
    }
    
    // Unlock and view the clue
    GameState.unlockClue(clueId);
    GameState.viewClue(clueId);
    
    // Update element appearance
    element.style.opacity = '1.0';
    element.style.cursor = 'grab';
    
    // Update clue count
    UI.updateClueCount();
    
    // Remove click handler since discovery already happened
    element.onclick = null;
}

/**
 * Initialize drag functionality for a post-it note element
 */
function initPostItDrag(element) {
    if (!element) return;
    
    // Skip if already initialized (check for existing listener)
    if (element.dataset.dragInitialized === 'true') return;
    element.dataset.dragInitialized = 'true';
    
    // Convert right positioning to left if needed (only once)
    const computedStyle = window.getComputedStyle(element);
    
    // If element uses 'right' positioning, convert to 'left' for easier drag calculations
    if (computedStyle.right !== 'auto' && computedStyle.left === 'auto') {
        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement.getBoundingClientRect();
        const right = parseFloat(computedStyle.right);
        // Calculate left position relative to parent
        const left = parentRect.width - rect.width - right;
        element.style.right = 'auto';
        element.style.left = left + 'px';
    }
    
    element.addEventListener('mousedown', handlePostItMouseDown);
    element.style.cursor = 'grab';
}

/**
 * Handle mousedown event on post-it note
 */
function handlePostItMouseDown(e) {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const parentRect = element.parentElement.getBoundingClientRect();
    
    dragState.isDragging = true;
    dragState.element = element;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.hasMoved = false;
    dragState.wasDrag = false;
    
    // Get current position
    const computedStyle = window.getComputedStyle(element);
    dragState.initialLeft = parseFloat(computedStyle.left) || 0;
    dragState.initialTop = parseFloat(computedStyle.top) || 0;
    
    element.style.cursor = 'grabbing';
    element.style.zIndex = '1000'; // Bring to front while dragging
    
    // Add global event listeners
    document.addEventListener('mousemove', handlePostItMouseMove);
    document.addEventListener('mouseup', handlePostItMouseUp);
    
    e.preventDefault();
}

/**
 * Handle mousemove event during drag
 */
function handlePostItMouseMove(e) {
    if (!dragState.isDragging || !dragState.element) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    // Check if mouse has moved significantly (threshold: 5px)
    const hasMovedSignificantly = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;
    if (hasMovedSignificantly) {
        dragState.hasMoved = true;
    }
    
    // Only prevent default and update position if we're actually dragging
    // This allows normal scroll behavior when not dragging
    if (dragState.hasMoved) {
        // Update element position
        const newLeft = dragState.initialLeft + deltaX;
        const newTop = dragState.initialTop + deltaY;
        
        dragState.element.style.left = newLeft + 'px';
        dragState.element.style.top = newTop + 'px';
        
        // Only prevent default when actively dragging to allow scrolling when not dragging
        e.preventDefault();
    }
}

/**
 * Handle mouseup event to end drag
 */
function handlePostItMouseUp(e) {
    if (!dragState.isDragging || !dragState.element) return;
    
    const element = dragState.element;
    
    // Check if the mouseup event is actually related to the post-it element
    // If the mouseup occurs on a different element (like a Steinhoff definition),
    // exit early to avoid interfering with other click handlers
    const target = e.target;
    if (target && element !== target && !element.contains(target)) {
        // Mouseup occurred on a different element - clean up listeners but don't process drag
        dragState.isDragging = false;
        dragState.element = null;
        dragState.wasDrag = false;
        dragState.hasMoved = false;
        
        // Restore cursor
        element.style.cursor = 'grab';
        element.style.zIndex = '10';
        
        // Remove global event listeners
        document.removeEventListener('mousemove', handlePostItMouseMove);
        document.removeEventListener('mouseup', handlePostItMouseUp);
        return;
    }
    
    const wasDrag = dragState.hasMoved;
    
    // Mark if this was a drag
    dragState.wasDrag = wasDrag;
    
    // If this was a drag, trigger clue discovery
    if (wasDrag) {
        const clueId = element.dataset.clueId;
        if (clueId) {
            // Check if clue hasn't been viewed yet
            const viewedClues = GameState.getViewedClues();
            if (!viewedClues.includes(clueId)) {
                discoverPostItClue(element, clueId);
            }
        }
    }
    
    // Reset drag state
    dragState.isDragging = false;
    dragState.element = null;
    
    // Restore cursor
    element.style.cursor = 'grab';
    element.style.zIndex = '10'; // Restore original z-index
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handlePostItMouseMove);
    document.removeEventListener('mouseup', handlePostItMouseUp);
    
    // Reset wasDrag after a short delay to allow click handler to check it
    setTimeout(() => {
        dragState.wasDrag = false;
        dragState.hasMoved = false;
    }, 50);
}

function updatePostItVisibility() {
    // Update secure-pager-code post-it visibility
    const pagerPostit = document.getElementById('pager-postit');
    if (pagerPostit) {
        // Store clue ID as data attribute
        pagerPostit.dataset.clueId = 'secure-pager-code';
        
        if (GameState.hasClueAccess('secure-pager-code')) {
            pagerPostit.style.display = '';
            // Initialize drag functionality
            initPostItDrag(pagerPostit);
            // Set initial opacity to 0.75 if not viewed yet
            const viewedClues = GameState.getViewedClues();
            if (!viewedClues.includes('secure-pager-code')) {
                pagerPostit.style.opacity = '0.75';
                pagerPostit.style.cursor = 'grab';
                // Add click handler
                pagerPostit.onclick = function(e) {
                    // Only handle click if it wasn't a drag
                    if (!dragState.wasDrag) {
                        discoverPostItClue(pagerPostit, 'secure-pager-code');
                    }
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
        // Store clue ID as data attribute
        shuePostit.dataset.clueId = 'shue-post-it';
        
        if (GameState.hasClueAccess('shue-post-it')) {
            shuePostit.style.display = '';
            // Initialize drag functionality
            initPostItDrag(shuePostit);
            // Set initial opacity to 0.75 if not viewed yet
            const viewedClues = GameState.getViewedClues();
            if (!viewedClues.includes('shue-post-it')) {
                shuePostit.style.opacity = '0.75';
                shuePostit.style.cursor = 'grab';
                // Add click handler
                shuePostit.onclick = function(e) {
                    // Only handle click if it wasn't a drag
                    if (!dragState.wasDrag) {
                        discoverPostItClue(shuePostit, 'shue-post-it');
                    }
                };
            } else {
                shuePostit.style.opacity = '1.0';
            }
        } else {
            shuePostit.style.display = 'none';
        }
    }
}

function updatePlayerBadge() {
    const playerBadge = document.getElementById('player-badge');
    if (!playerBadge) return;
    
    const team = GameState.getTeam();
    const currentPlayerIndex = GameState.getCurrentPlayerIndex();
    
    // Default to single player if no team data
    if (team.size === 0 || !team.members || team.members.length === 0) {
        playerBadge.innerHTML = `
            <span class="player-icon">♥</span>
            <span class="player-name">Heart</span>
        `;
        return;
    }
    
    // Ensure player index is valid
    if (currentPlayerIndex < 0 || currentPlayerIndex >= team.members.length) {
        playerBadge.innerHTML = '';
        return;
    }
    
    const codeName = team.members[currentPlayerIndex];
    const icon = CODE_NAME_ICONS[currentPlayerIndex];
    
    playerBadge.innerHTML = `
        <span class="player-icon">${icon}</span>
        <span class="player-name">${codeName}</span>
    `;
}

function enableDirtyHarrySubmitButton() {
    const submitBtn = document.getElementById('dirty-harry-submit-btn');
    if (submitBtn) {
        // Update button text - LLM is ready
        submitBtn.textContent = 'Submit Story';
        
        // Now update button state based on textarea content
        // This will enable if there's text, disable if empty
        if (typeof Puzzles !== 'undefined' && Puzzles.updateDirtyHarrySubmitButton) {
            Puzzles.updateDirtyHarrySubmitButton();
        } else {
            // Fallback: just enable the button if Puzzles not available
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    }
}

async function initializeDirtyHarryLLM() {
    // Check if WebLLM is available
    if (!window.webllm) {
        console.warn('WebLLM not available, Dirty Harry validation will use fallback');
        window.dirtyHarryLLMEngine = null;
        // Enable button anyway since we have fallback
        enableDirtyHarrySubmitButton();
        return;
    }
    
    // Check if Cache API is available (required by WebLLM)
    // Cache API is only available in secure contexts (HTTPS or localhost)
    if (typeof caches === 'undefined') {
        console.warn('Cache API not available. WebLLM requires HTTPS or localhost. Dirty Harry validation will use fallback.');
        window.dirtyHarryLLMEngine = null;
        // Enable button anyway since we have fallback
        enableDirtyHarrySubmitButton();
        return;
    }
    
    try {
        // Initialize progress callback
        const initProgressCallback = (progress) => {
            // Update button text with loading progress
            const submitBtn = document.getElementById('dirty-harry-submit-btn');
            if (submitBtn && progress.progress > 0 && progress.progress < 1) {
                const percent = Math.round(progress.progress * 100);
                submitBtn.textContent = `Loading... ${percent}%`;
            }
        };
        
        // Create and load the LLM engine
        const engine = await window.webllm.CreateMLCEngine(
            'SmolLM2-360M-Instruct-q4f32_1-MLC',
            { initProgressCallback }
        );
        
        // Store engine globally for use in validation
        window.dirtyHarryLLMEngine = engine;
        console.log('Dirty Harry LLM engine loaded successfully');
        
        // Enable submit button now that LLM is ready
        enableDirtyHarrySubmitButton();
    } catch (error) {
        console.error('Failed to load Dirty Harry LLM engine:', error);
        // Don't block game initialization if LLM fails to load
        // Validation will fall back to regex-based validation
        window.dirtyHarryLLMEngine = null;
        // Enable button anyway since we have fallback
        enableDirtyHarrySubmitButton();
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
    
    // Update player badge
    updatePlayerBadge();
    
    // Start timer
    startTimer();
    
    // Load initial content
    await loadInitialContent();
    
    // Initialize LLM for Dirty Harry validation if player has access (non-blocking)
    if (GameState.hasClueAccess('dirty-harry')) {
        initializeDirtyHarryLLM(); // Don't await - let it load in background
    }
    
    // Update post-it note visibility (before setupDiscoveryLocations to ensure it's set)
    updatePostItVisibility();
    
    // Setup discovery locations
    setupDiscoveryLocations();
    
    // Configure submit button and initial view based on completion state
    // Only first player (index 0) can access form selection
    const currentPlayerIndex = GameState.getCurrentPlayerIndex();
    const isFirstPlayer = currentPlayerIndex === 0;
    
    const submitBtn = document.getElementById('submit-form-btn');
    const placeholder = document.getElementById('button-placeholder');
    
    if (GameState.isGameCompleted()) {
        // Completed game: allow first player to go directly to the form selection
        if (isFirstPlayer) {
            showFormSelection();
            if (submitBtn) submitBtn.style.display = 'none';
            if (placeholder) placeholder.style.display = 'none';
        } else {
            if (submitBtn) submitBtn.style.display = 'none';
            if (placeholder) placeholder.style.display = 'block';
        }
    } else {
        // In-progress game: show submit button only to first player
        if (isFirstPlayer) {
            if (submitBtn) {
                submitBtn.style.display = 'block';
                submitBtn.textContent = 'Select Authorization Form';
            }
            if (placeholder) placeholder.style.display = 'none';
        } else {
            if (submitBtn) submitBtn.style.display = 'none';
            if (placeholder) placeholder.style.display = 'block';
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
                const discoveryGrid = document.getElementById('discovery-grid');
                
                // Hide discovery grid when showing code input
                if (discoveryGrid) {
                    discoveryGrid.style.display = 'none';
                }
                
                if (viewer) {
                    viewer.innerHTML = `
                        <div class="clue-header">
                            <h2>Secure Pager Connection</h2>
                            <button class="clue-close-button" onclick="UI.closeClueViewer()" aria-label="Close">×</button>
                        </div>
                        <div class="code-input-container">
                            <p>Establish secure connection to receive advisor transmission.</p>
                            <input type="text" id="code-input" placeholder="Enter connection code" autocomplete="off" maxlength="10">
                            <button onclick="UI.submitCode('${location.clueId}')">Establish Connection</button>
                            <p id="code-error" class="error-message" style="display:none;"></p>
                        </div>
                    `;
                    
                    viewer.style.display = 'block';
                    
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
            ${GameState.hasClueAccess('shue-post-it') ? `
            <div class="postit-note" id="shue-postit" data-clue-id="shue-post-it" style="opacity: ${GameState.getViewedClues().includes('shue-post-it') ? '1.0' : '0.75'}; cursor: ${GameState.getViewedClues().includes('shue-post-it') ? 'default' : 'pointer'};">
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
    
    // Set up click handler and drag functionality for shue-post-it if it exists
    setTimeout(() => {
        const shuePostit = document.getElementById('shue-postit');
        if (shuePostit) {
            // Ensure clue ID is stored (in case it wasn't in the HTML template)
            shuePostit.dataset.clueId = 'shue-post-it';
            
            // Initialize drag functionality
            initPostItDrag(shuePostit);
            
            // Set up click handler if not viewed yet
            if (!GameState.getViewedClues().includes('shue-post-it')) {
                shuePostit.onclick = function(e) {
                    // Only handle click if it wasn't a drag
                    if (!dragState.wasDrag) {
                        discoverPostItClue(shuePostit, 'shue-post-it');
                    }
                };
            }
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
    
    // Only first player can access form selection
    const currentPlayerIndex = GameState.getCurrentPlayerIndex();
    const isFirstPlayer = currentPlayerIndex === 0;
    
    if (isFirstPlayer) {
        // Prompt first player via modal to proceed to decision page
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
    } else {
        // Other players see a message that only the team captain can submit
        if (typeof UI !== 'undefined' && typeof UI.showModal === 'function') {
            UI.showModal(
                'Decision Time',
                'Time is running out. Only the team captain (Heart) can submit the authorization form.',
                [
                    {
                        text: 'OK',
                        class: 'modal-button-primary',
                        onclick: 'UI.hideModal();'
                    }
                ]
            );
        }
    }
}

function showFormSelection() {
    // Only first player (index 0) can access form selection
    const currentPlayerIndex = GameState.getCurrentPlayerIndex();
    if (currentPlayerIndex !== 0) {
        // Show error message to non-first players
        if (typeof UI !== 'undefined' && typeof UI.showModal === 'function') {
            UI.showModal(
                'Access Restricted',
                'Only the team captain (Heart) can submit the authorization form.',
                [
                    {
                        text: 'OK',
                        class: 'modal-button-primary',
                        onclick: 'UI.hideModal();'
                    }
                ]
            );
        }
        return;
    }
    
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
