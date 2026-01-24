/**
 * Core game logic: timer, state management, game lifecycle
 */

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
    
    checkThoroughness() {
        // Check if dirty harry is unlocked
        if (!this.isClueUnlocked('dirty-harry')) {
            return { shouldWarn: false };
        }
        
        // Check if more than 15:00 minutes remaining
        const remaining = this.getRemainingTime();
        if (remaining <= 900) { // 15 minutes = 900 seconds
            return { shouldWarn: false };
        }
        
        // Check if pamphlet clue is NOT unlocked
        if (this.isClueUnlocked('pamphlet')) {
            return { shouldWarn: false };
        }
        
        return {
            shouldWarn: true,
            message: 'The department expects thoroughness. You should search for more information before making this decision.'
        };
    },

    getRemainingTime() {
        const startTime = parseInt(localStorage.getItem('gameStartTime') || '0');
        if (!startTime) return 0;
        
        const elapsed = (Date.now() - startTime) / 1000; // seconds
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
            expired: remaining === 0
        };
    },

    handleTimeExpired() {
        if (this.updateTimer().expired) {
            localStorage.setItem('gameCompleted', 'true');
            return true;
        }
        return false;
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

    setSelectedForm(formId) {
        localStorage.setItem('selectedForm', formId);
    },

    getSelectedForm() {
        return localStorage.getItem('selectedForm');
    },

    isGameCompleted() {
        return localStorage.getItem('gameCompleted') === 'true';
    }
};
