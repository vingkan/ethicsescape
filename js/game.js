/**
 * Core game logic: timer, state management, game lifecycle
 */

// Code name constants
const CODE_NAMES = ['Heart', 'Spade', 'Diamond', 'Club'];
const CODE_NAME_ICONS = ['♥', '♠', '♦', '♣'];

const GameState = {
    init() {
        // Check if game is in progress
        const startTime = localStorage.getItem('gameStartTime');
        if (startTime) {
            const remaining = this.getRemainingTime();
            if (remaining > 0) {
                // Resume existing game
                return true;
            } else {
                // Game expired, clear state
                this.startNewGame();
            }
        }
        return false;
    },

    startNewGame() {
        // Clear all game state (but keep team data)
        localStorage.removeItem('gameStartTime');
        localStorage.removeItem('gameFinishedTime');
        localStorage.removeItem('cluesUnlocked');
        localStorage.removeItem('cluesViewed');
        localStorage.removeItem('gameCompleted');
        localStorage.removeItem('selectedForm');
        localStorage.removeItem('benthamAnswers');
        localStorage.removeItem('steinhoffMatches');
        localStorage.removeItem('historicalRecords');
        localStorage.removeItem('interveningAction');
        localStorage.removeItem('dirtyHarryStory');
        localStorage.removeItem('formSelections');
        localStorage.removeItem('customFormData');
        localStorage.removeItem('customFormContent');
        
        // Set new start time
        localStorage.setItem('gameStartTime', Date.now().toString());
        localStorage.setItem('cluesUnlocked', JSON.stringify([]));
        localStorage.setItem('cluesViewed', JSON.stringify([]));
        localStorage.setItem('gameCompleted', 'false');
    },
    
    resetTeam() {
        localStorage.removeItem('teamMembers');
        localStorage.removeItem('teamSize');
        localStorage.removeItem('formSelections');
        localStorage.removeItem('customFormData');
        localStorage.removeItem('customFormContent');
        // Clear game start time to indicate that no game is in progress
        localStorage.removeItem('gameStartTime');
    },
    
    saveTeam(teamMembers) {
        localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
        localStorage.setItem('teamSize', teamMembers.length.toString());
    },
    
    getTeam() {
        const teamMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]');
        const teamSize = parseInt(localStorage.getItem('teamSize') || '0');
        return {
            members: teamMembers,
            size: teamSize
        };
    },
    
    getCurrentPlayerIndex() {
        // Get current player index from localStorage, default to 0 if not set
        const index = localStorage.getItem('currentPlayerIndex');
        return index !== null ? parseInt(index) : 0;
    },
    
    setCurrentPlayerIndex(index) {
        localStorage.setItem('currentPlayerIndex', index.toString());
    },
    
    checkThoroughness() {
        // Check if custom-form is unlocked
        if (this.isClueUnlocked('custom-form')) {
            return { shouldWarn: false };
        }
        
        // Check if less than 15:00 minutes remaining
        const remaining = this.getRemainingTime();
        if (remaining <= 900) { // 15 minutes = 900 seconds
            return { shouldWarn: false };
        }
        
        // More than 15 minutes remaining and custom-form not unlocked
        return {
            shouldWarn: true,
            message: 'The department expects thoroughness.\n\nRemember the tale of Dirty Harry.\n\nUse code 1971 to unlock the Dirty Harry clue (for the player who has access to it).'
        };
    },

    getRemainingTime() {
        const startTime = parseInt(localStorage.getItem('gameStartTime') || '0');
        if (!startTime) return 0;
        
        const finishedTime = parseInt(localStorage.getItem('gameFinishedTime') || '0');
        const now = finishedTime ? finishedTime : Date.now();
        
        const elapsed = (now - startTime) / 1000; // seconds
        const remaining = Math.max(0, 3600 - elapsed); // 60 minutes = 3600 seconds
        return Math.floor(remaining);
    },

    updateTimer() {
        const remaining = this.getRemainingTime();
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return {
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0'),
            total: remaining,
            expired: remaining <= (5 * 60)
        };
    },

    isClueUnlocked(clueId) {
        const unlocked = JSON.parse(localStorage.getItem('cluesUnlocked') || '[]');
        return unlocked.includes(clueId);
    },

    unlockClue(clueId) {
        if (this.isClueUnlocked(clueId)) return;
        
        const unlocked = JSON.parse(localStorage.getItem('cluesUnlocked') || '[]');
        unlocked.push(clueId);
        localStorage.setItem('cluesUnlocked', JSON.stringify(unlocked));
    },

    viewClue(clueId) {
        const viewed = JSON.parse(localStorage.getItem('cluesViewed') || '[]');
        if (!viewed.includes(clueId)) {
            viewed.push(clueId);
            localStorage.setItem('cluesViewed', JSON.stringify(viewed));
        }
    },

    getUnlockedClues() {
        return JSON.parse(localStorage.getItem('cluesUnlocked') || '[]');
    },
    
    getViewedClues() {
        return JSON.parse(localStorage.getItem('cluesViewed') || '[]');
    },

    setSelectedForm(formId) {
        localStorage.setItem('selectedForm', formId);
    },

    getSelectedForm() {
        return localStorage.getItem('selectedForm');
    },

    isGameCompleted() {
        return localStorage.getItem('gameCompleted') === 'true';
    },
    
    getPlayerClues(playerIndex, teamSize) {
        // Always available clues
        const alwaysAvailable = ['briefing', 'mdos-chart', 'custom-form', 'truth'];
        
        // Player-specific clues based on distribution tables
        let playerClues = [];
        
        // Ensure playerIndex and teamSize are numbers
        playerIndex = Number(playerIndex);
        teamSize = Number(teamSize);
        
        if (teamSize === 1) {
            // One player gets all clues
            playerClues = [
                'form-a', 'form-b', 'shue-post-it', 'secure-pager-code',
                'shue-essay', 'advisor', 'bentham-scales', 'steinhoff-definitions',
                'historical-records', 'intervening-action', 'pamphlet', 'dirty-harry'
            ];
        } else if (teamSize === 2) {
            if (playerIndex === 0) {
                playerClues = ['form-a', 'shue-post-it', 'shue-essay', 'bentham-scales', 'historical-records', 'pamphlet'];
            } else if (playerIndex === 1) {
                playerClues = ['form-b', 'secure-pager-code', 'advisor', 'steinhoff-definitions', 'intervening-action', 'dirty-harry'];
            }
        } else if (teamSize === 3) {
            if (playerIndex === 0) {
                playerClues = ['form-a', 'secure-pager-code', 'bentham-scales', 'intervening-action'];
            } else if (playerIndex === 1) {
                playerClues = ['form-b', 'shue-essay', 'steinhoff-definitions', 'pamphlet'];
            } else if (playerIndex === 2) {
                playerClues = ['shue-post-it', 'advisor', 'historical-records', 'dirty-harry'];
            }
        } else if (teamSize === 4) {
            if (playerIndex === 0) {
                playerClues = ['form-a', 'shue-essay', 'historical-records'];
            } else if (playerIndex === 1) {
                playerClues = ['form-b', 'advisor', 'intervening-action'];
            } else if (playerIndex === 2) {
                playerClues = ['shue-post-it', 'bentham-scales', 'pamphlet'];
            } else if (playerIndex === 3) {
                playerClues = ['secure-pager-code', 'steinhoff-definitions', 'dirty-harry'];
            }
        } else {
            // For teams larger than 4, default to single player (all clues)
            playerClues = [
                'form-a', 'form-b', 'shue-post-it', 'secure-pager-code',
                'shue-essay', 'advisor', 'bentham-scales', 'steinhoff-definitions',
                'historical-records', 'intervening-action', 'pamphlet', 'dirty-harry'
            ];
        }
        
        return [...alwaysAvailable, ...playerClues];
    },
    
    hasClueAccess(clueId) {
        const team = this.getTeam();
        // If no team data, default to single player (all clues)
        if (team.size === 0) {
            return true;
        }
        const playerIndex = this.getCurrentPlayerIndex();
        // Ensure player index is within valid range
        if (playerIndex < 0 || playerIndex >= team.size) {
            // If player index is out of range, return false (don't show clue)
            return false;
        }
        const playerClues = this.getPlayerClues(playerIndex, team.size);
        return playerClues.includes(clueId);
    }
};
