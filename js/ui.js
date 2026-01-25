/**
 * UI components: DOM manipulation, animations, interactions
 */

const UI = {
    markdownConverter: null,
    
    init() {
        // Initialize markdown converter
        if (typeof marked !== 'undefined') {
            this.markdownConverter = marked;
            // Configure marked options
            marked.setOptions({
                breaks: true,
                gfm: true
            });
        }
    },
    
    viewFinalResults() {
        const formId = GameState.getSelectedForm();
        if (!formId) return;
        this.selectForm(formId);
    },

    renderMarkdown(markdown) {
        if (!markdown) return '';
        if (this.markdownConverter) {
            return this.markdownConverter.parse(markdown);
        }
        // Fallback: basic HTML with line breaks
        return markdown.split('\n').map(line => {
            if (line.startsWith('# ')) {
                return `<h1>${line.substring(2)}</h1>`;
            } else if (line.startsWith('## ')) {
                return `<h2>${line.substring(3)}</h2>`;
            } else if (line.startsWith('### ')) {
                return `<h3>${line.substring(4)}</h3>`;
            } else if (line.startsWith('> ')) {
                return `<blockquote>${line.substring(2)}</blockquote>`;
            } else if (line.trim() === '') {
                return '<br>';
            } else {
                return `<p>${line}</p>`;
            }
        }).join('');
    },

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, (c) => {
            if (c === '&') return '&amp;';
            if (c === '<') return '&lt;';
            if (c === '>') return '&gt;';
            return c;
        });
    },

    updateTimer(display) {
        const timerEl = document.getElementById('timer-display');
        if (timerEl) {
            const { minutes, seconds, expired } = display;
            timerEl.textContent = `${minutes}:${seconds}`;
            
            if (expired) {
                timerEl.classList.add('expired');
            } else if (display.total < 600) { // Less than 10 minutes
                timerEl.classList.add('warning');
            }
        }
    },

    updateClueCount() {
        const countEl = document.getElementById('clue-count');
        if (countEl) {
            // Only count custom-form clue (available to all players)
            const unlockedIds = GameState.getUnlockedClues();
            const customFormUnlocked = unlockedIds.includes('custom-form');
            
            const unlockedCount = customFormUnlocked ? 1 : 0;
            const totalCount = 1;
            
            countEl.textContent = `${unlockedCount} / ${totalCount}`;
        }
    },

    showClue(clueId, content) {
        const viewer = document.getElementById('clue-viewer');
        if (!viewer) return;
        
        const clue = ClueSystem.getClue(clueId);
        if (!clue) return;
        
        // Render content
        if (content) {
            viewer.innerHTML = `
                <div class="clue-header">
                    <h2>${clue.name}</h2>
                </div>
                <div class="clue-content">
                    ${this.renderMarkdown(content)}
                </div>
            `;
        } else {
            viewer.innerHTML = `
                <div class="clue-header">
                    <h2>${clue.name}</h2>
                </div>
                <div class="clue-content">
                    <p>Loading...</p>
                </div>
            `;
        }
        
        // Mark as viewed
        GameState.viewClue(clueId);
    },

    showCodeInput(clueId) {
        const viewer = document.getElementById('clue-viewer');
        if (!viewer) return;
        
        const clue = ClueSystem.getClue(clueId);
        
        // Add hint for Shue clue
        let hintText = '';
        if (clueId === 'shue-essay') {
            hintText = '<p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;"><em>Hint: This document references a paper from a specific year. Historical documents may be encoded with publication dates.</em></p>';
        }
        
        viewer.innerHTML = `
            <div class="clue-header">
                <h2>${clue.name}</h2>
            </div>
            <div class="code-input-container">
                <p>Enter the code to unlock this document:</p>
                ${hintText}
                <input type="text" id="code-input" placeholder="Enter code" autocomplete="off" maxlength="10">
                <button onclick="UI.submitCode('${clueId}')">Submit</button>
                <p id="code-error" class="error-message" style="display:none;"></p>
            </div>
        `;
        
        // Focus input and allow Enter key
        const input = document.getElementById('code-input');
        if (input) {
            input.focus();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    UI.submitCode(clueId);
                }
            });
        }
    },

    async submitCode(clueId) {
        const input = document.getElementById('code-input');
        const errorEl = document.getElementById('code-error');
        
        if (!input) return;
        
        const code = input.value.trim();
        if (!code) {
            if (errorEl) {
                errorEl.textContent = 'Please enter a code';
                errorEl.style.display = 'block';
            }
            return;
        }
        
        if (ClueSystem.validateCode(clueId, code)) {
            // Correct code
            GameState.unlockClue(clueId);
            const clue = ClueSystem.getClue(clueId);
            
            // Handle puzzle-type clues - show puzzle directly instead of loading content
            const puzzleClueIds = ['steinhoff-definitions', 'bentham-scales', 'dirty-harry', 'historical-records', 'intervening-action'];
            if (puzzleClueIds.includes(clueId)) {
                // Show puzzle directly for puzzle-type clues
                if (clueId === 'steinhoff-definitions') {
                    Puzzles.showSteinhoffMatching();
                } else if (clueId === 'bentham-scales') {
                    Puzzles.showBenthamScales();
                } else if (clueId === 'historical-records') {
                    Puzzles.showHistoricalRecords();
                } else if (clueId === 'intervening-action') {
                    Puzzles.showInterveningAction();
                } else if (clueId === 'dirty-harry') {
                    Puzzles.showDirtyHarry();
                }
            } else {
                // Document-type clue: load and show content
                const content = await ClueSystem.loadClueContent(clueId);
                
                // Special handling for advisor
                if (clueId === 'advisor') {
                    this.showClue(clueId, content);
                    // Show message about using this for Bentham scales
                    setTimeout(() => {
                        const viewer = document.getElementById('clue-viewer');
                        if (viewer) {
                            viewer.innerHTML += `
                                <div style="background: var(--bg-darker); border-left: 4px solid var(--text-amber); padding: 1rem; margin-top: 1rem;">
                                    <p style="color: var(--text-amber); margin: 0;">
                                        <strong>Note:</strong> Use this advisor assessment to complete the Bentham's Scales worksheet. 
                                        Quantify the threat according to intensity, duration, certainty, and nearness.
                                    </p>
                                </div>
                            `;
                        }
                    }, 100);
                } else {
                    this.showClue(clueId, content);
                }
            }
            
            this.updateClueCount();
            
            // Refresh discovery locations to show checkmark
            if (typeof setupDiscoveryLocations === 'function') {
                setupDiscoveryLocations();
            }
        } else {
            // Incorrect code
            if (errorEl) {
                errorEl.textContent = 'Incorrect code. Try again.';
                errorEl.style.display = 'block';
            }
            input.value = '';
        }
    },

    showPuzzle(clueId, puzzleHTML) {
        const viewer = document.getElementById('clue-viewer');
        if (!viewer) return;
        
        const clue = ClueSystem.getClue(clueId);
        viewer.innerHTML = `
            <div class="clue-header">
                <h2>${clue.name}</h2>
            </div>
            <div class="puzzle-container">
                ${puzzleHTML}
            </div>
        `;
    },

    showFormSelection(forms) {
        const gameCompleted = GameState.isGameCompleted();
        
        // Hide discovery grid and clue viewer
        const discoveryGrid = document.getElementById('discovery-grid');
        const clueViewer = document.getElementById('clue-viewer');
        const formSelectionView = document.getElementById('form-selection-view');
        const customFormView = document.getElementById('custom-form-view');
        
        if (discoveryGrid) discoveryGrid.style.display = 'none';
        if (clueViewer) clueViewer.style.display = 'none';
        if (customFormView) customFormView.style.display = 'none';
        
        // Hide post-it notes
        const postitNotes = document.querySelectorAll('.postit-note');
        postitNotes.forEach(note => {
            note.style.display = 'none';
        });
        
        if (!formSelectionView) return;
        
        // Get team data
        const team = GameState.getTeam();
        if (team.size === 0) {
            // Fallback if no team data
            formSelectionView.innerHTML = `
                <div class="form-selection-header">
                    <button class="back-button" onclick="UI.returnToMainGame()">← Back to Investigation</button>
                    <h2>Select Authorization Form</h2>
                    <p style="color: var(--text-red);">No team data found. Please restart the game.</p>
                </div>
            `;
            formSelectionView.style.display = 'block';
            return;
        }
        
        // Load existing form selections
        const formSelections = JSON.parse(localStorage.getItem('formSelections') || '{}');
        
        // Check if custom form is unlocked
        const customFormUnlocked = GameState.isClueUnlocked('custom-form');
        
        // Build team slots HTML
        const teamSlotsHTML = team.members.map((member, index) => {
            const selection = formSelections[member] || { form: '', reason: '' };
            const selectDisabledAttr = gameCompleted ? 'disabled' : '';
            const textareaReadonlyAttr = gameCompleted ? 'readonly' : '';
            const selectOnChange = gameCompleted ? '' : `onchange="UI.updateFormSelection('${member}', this.value)"`;
            const textareaOnChange = gameCompleted ? '' : `onchange="UI.updateFormReason('${member}', this.value, ${index})"`;
            return `
                <div class="team-slot" style="background: var(--bg-darker); border: 2px solid var(--border-color); padding: 1.5rem; margin-bottom: 1rem;">
                    <h3 style="color: var(--text-amber); margin-top: 0;">${member}</h3>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Form Selection:</label>
                        <select id="form-select-${index}" 
                                style="width: 100%; padding: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-primary); font-family: 'Courier New', monospace;"
                                ${selectOnChange} ${selectDisabledAttr}>
                            <option value="">Select a form...</option>
                            <option value="form-a" ${selection.form === 'form-a' ? 'selected' : ''}>Form A: Enhanced Interrogation</option>
                            <option value="form-b" ${selection.form === 'form-b' ? 'selected' : ''}>Form B: Psychologist Discussion</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Why ${member} supports this option:</label>
                        <textarea id="form-reason-${index}" 
                                  rows="3" 
                                  style="width: 100%; padding: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-primary); font-family: 'Courier New', monospace; resize: vertical;"
                                  placeholder="Enter reason (at least 5 words)..."
                                  ${textareaOnChange} ${textareaReadonlyAttr}>${selection.reason}</textarea>
                        <p id="form-reason-error-${index}" class="error-message" style="display: none; color: var(--text-red); font-size: 0.9rem; margin-top: 0.5rem;"></p>
                    </div>
                </div>
            `;
        }).join('');
        
        // Calculate acceptance status
        const acceptanceStatus = this.checkFormAcceptance(formSelections, team);
        
        // Build custom form button if unlocked
        const customFormButton = customFormUnlocked ? `
            <div style="text-align: center; margin-bottom: 2rem;">
                <button onclick="UI.showCustomFormBuilder()" 
                        style="padding: 1rem 2rem; background: var(--text-amber); border: none; color: var(--bg-dark); font-family: 'Courier New', monospace; font-size: 1.1rem; cursor: pointer; text-transform: uppercase; font-weight: bold;">
                    Create Custom Authorization Form
                </button>
            </div>
        ` : '';
        
        const buttonLabel = gameCompleted ? 'View Results' : 'Submit Form Selection';
        const buttonOnClick = gameCompleted ? 'UI.viewFinalResults()' : 'UI.submitTeamFormSelection()';
        const buttonDisabledAttr = gameCompleted ? '' : (acceptanceStatus.canSubmit ? '' : 'disabled');
        const buttonBackground = gameCompleted
            ? 'var(--accent-green)'
            : (acceptanceStatus.canSubmit ? 'var(--accent-green)' : 'var(--bg-darker)');
        const buttonCursor = gameCompleted ? 'pointer' : (acceptanceStatus.canSubmit ? 'pointer' : 'not-allowed');
        const buttonOpacity = gameCompleted ? '1' : (acceptanceStatus.canSubmit ? '1' : '0.5');
        
        // Eiree message - only show if custom-form is not unlocked
        const eireeMessage = !customFormUnlocked ? `
            <div style="text-align: center; margin: 2rem 0; padding: 1rem; background: var(--bg-darker); border: 2px dashed var(--text-amber); cursor: pointer; transition: all 0.3s ease;" 
                 onclick="UI.showAuthorizationCodeModal()"
                 onmouseover="this.style.borderColor='var(--text-red)'; this.style.background='var(--bg-dark)'"
                 onmouseout="this.style.borderColor='var(--text-amber)'; this.style.background='var(--bg-darker)'">
                <p style="color: var(--text-amber); font-size: 1.1rem; margin: 0; font-style: italic;">
                    Are there really only two answers to this problem?
                </p>
            </div>
        ` : '';
        
        formSelectionView.innerHTML = `
            <div class="form-selection-header">
                <button class="back-button" onclick="UI.returnToMainGame()">← Back to Investigation</button>
                <h2>Team Authorization Form Selection</h2>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    For each team member, select which form they support and explain why. You must reach the acceptance threshold before submitting.
                </p>
                <div style="background: var(--bg-darker); border-left: 4px solid var(--text-amber); padding: 1rem; margin-bottom: 1.5rem;">
                    <p style="margin: 0; color: var(--text-primary);">
                        <strong>Acceptance Status:</strong> ${acceptanceStatus.message}
                    </p>
                </div>
            </div>
            ${eireeMessage}
            ${customFormButton}
            <div class="team-selection-container">
                ${teamSlotsHTML}
            </div>
            <div style="text-align: center; margin-top: 2rem;">
                <button onclick="${buttonOnClick}" 
                        id="submit-team-form-btn"
                        ${buttonDisabledAttr}
                        style="padding: 1rem 2rem; background: ${buttonBackground}; border: none; color: var(--text-primary); font-family: 'Courier New', monospace; font-size: 1.1rem; cursor: ${buttonCursor}; text-transform: uppercase; opacity: ${buttonOpacity};">
                    ${buttonLabel}
                </button>
            </div>
        `;
        formSelectionView.style.display = 'block';
        
        // Hide manual submit button
        const submitBtn = document.getElementById('submit-form-btn');
        if (submitBtn) submitBtn.style.display = 'none';
        
        // Scroll to top
        window.scrollTo(0, 0);
    },
    
    updateFormSelection(memberName, formId) {
        const formSelections = JSON.parse(localStorage.getItem('formSelections') || '{}');
        if (!formSelections[memberName]) {
            formSelections[memberName] = { form: '', reason: '' };
        }
        formSelections[memberName].form = formId;
        localStorage.setItem('formSelections', JSON.stringify(formSelections));
        
        // Refresh the view to update acceptance status
        const forms = [
            { id: 'form-a', name: 'Form A: Enhanced Interrogation', preview: 'Authorizes enhanced interrogation techniques.' },
            { id: 'form-b', name: 'Form B: Psychologist Discussion', preview: 'Authorizes psychologist discussion.' }
        ];
        this.showFormSelection(forms);
    },
    
    updateFormReason(memberName, reason, index) {
        const formSelections = JSON.parse(localStorage.getItem('formSelections') || '{}');
        if (!formSelections[memberName]) {
            formSelections[memberName] = { form: '', reason: '' };
        }
        formSelections[memberName].reason = reason;
        localStorage.setItem('formSelections', JSON.stringify(formSelections));
        
        // Validate and show errors
        this.validateFormReason(memberName, reason, index, formSelections);
        
        // Refresh acceptance status
        const team = GameState.getTeam();
        const acceptanceStatus = this.checkFormAcceptance(formSelections, team);
        const submitBtn = document.getElementById('submit-team-form-btn');
        if (submitBtn) {
            submitBtn.disabled = !acceptanceStatus.canSubmit;
        }
    },
    
    validateFormReason(memberName, reason, index, formSelections) {
        const errorEl = document.getElementById(`form-reason-error-${index}`);
        if (!errorEl) return;
        
        const errors = [];
        
        // Check word count (at least 5 words)
        const wordCount = reason.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 5) {
            errors.push('Reason must be at least 5 words long.');
        }
        
        // Check for duplicates
        const team = GameState.getTeam();
        const otherMembers = team.members.filter(m => m !== memberName);
        otherMembers.forEach(otherMember => {
            const otherSelection = formSelections[otherMember];
            if (otherSelection && otherSelection.reason && 
                reason.trim().toLowerCase() === otherSelection.reason.trim().toLowerCase()) {
                errors.push(`Reason cannot be identical to ${otherMember}'s reason.`);
            }
        });
        
        // Display errors
        if (errors.length > 0) {
            errorEl.textContent = errors.join(' ');
            errorEl.style.display = 'block';
        } else {
            errorEl.style.display = 'none';
        }
    },
    
    checkFormAcceptance(formSelections, team) {
        // Count selections for each form
        const formACount = Object.values(formSelections).filter(s => s.form === 'form-a').length;
        const formBCount = Object.values(formSelections).filter(s => s.form === 'form-b').length;
        
        // Calculate threshold
        let threshold;
        if (team.size === 1) {
            threshold = 1;
        } else if (team.size === 2) {
            threshold = 2;
        } else {
            threshold = team.size - 1;
        }
        
        // Check if threshold is met
        const formAReached = formACount >= threshold;
        const formBReached = formBCount >= threshold;
        const canSubmit = formAReached || formBReached;
        
        let message;
        if (canSubmit) {
            if (formAReached && formBReached) {
                message = `Both forms have reached the threshold (${threshold}/${team.size}). Choose one to submit.`;
            } else if (formAReached) {
                message = `Form A has reached the threshold (${formACount}/${team.size} players agree).`;
            } else {
                message = `Form B has reached the threshold (${formBCount}/${team.size} players agree).`;
            }
        } else {
            const maxCount = Math.max(formACount, formBCount);
            message = `Need ${threshold} players to agree. Currently: ${maxCount}/${team.size} players agree on one form.`;
        }
        
        return {
            canSubmit,
            threshold,
            formACount,
            formBCount,
            message
        };
    },
    
    submitTeamFormSelection() {
        const formSelections = JSON.parse(localStorage.getItem('formSelections') || '{}');
        const team = GameState.getTeam();
        
        // Validate all reasons before checking acceptance
        let allValid = true;
        team.members.forEach((member, index) => {
            const selection = formSelections[member];
            if (!selection || !selection.reason) {
                allValid = false;
                const errorEl = document.getElementById(`form-reason-error-${index}`);
                if (errorEl) {
                    errorEl.textContent = 'Reason is required.';
                    errorEl.style.display = 'block';
                }
            } else {
                this.validateFormReason(member, selection.reason, index, formSelections);
                const errorEl = document.getElementById(`form-reason-error-${index}`);
                if (errorEl && errorEl.style.display !== 'none') {
                    allValid = false;
                }
            }
        });
        
        if (!allValid) {
            // Scroll to first error
            const firstError = document.querySelector('.error-message[style*="block"]');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        const acceptanceStatus = this.checkFormAcceptance(formSelections, team);
        
        if (!acceptanceStatus.canSubmit) {
            return;
        }
        
        // Determine which form to submit
        let selectedForm = null;
        if (acceptanceStatus.formACount >= acceptanceStatus.threshold && acceptanceStatus.formBCount >= acceptanceStatus.threshold) {
            // Both reached - need to choose
            this.showModal(
                'Multiple Forms Reached Threshold',
                'Both Form A and Form B have reached the acceptance threshold. Which form would you like to submit?',
                [
                    {
                        text: 'Form A',
                        class: 'modal-button-primary',
                        onclick: `UI.hideModal(); UI.processFormSubmission('form-a')`
                    },
                    {
                        text: 'Form B',
                        class: 'modal-button-primary',
                        onclick: `UI.hideModal(); UI.processFormSubmission('form-b')`
                    },
                    {
                        text: 'Cancel',
                        class: 'modal-button-secondary',
                        onclick: 'UI.hideModal()'
                    }
                ]
            );
            return;
        } else if (acceptanceStatus.formACount >= acceptanceStatus.threshold) {
            selectedForm = 'form-a';
        } else {
            selectedForm = 'form-b';
        }
        
        this.processFormSubmission(selectedForm);
    },
    
    processFormSubmission(formId) {
        // Check thoroughness warning
        const thoroughness = GameState.checkThoroughness();
        if (thoroughness.shouldWarn) {
            this.showModal(
                'Thoroughness Warning',
                thoroughness.message,
                [
                    // {
                    //     text: 'Continue Anyway',
                    //     class: 'modal-button-primary',
                    //     onclick: `UI.hideModal(); UI.showFormConfirmation('${formId}', '${formId === 'form-a' ? 'Form A' : 'Form B'}')`
                    // },
                    {
                        text: 'Go Back',
                        class: 'modal-button-secondary',
                        onclick: 'UI.hideModal()'
                    }
                ]
            );
            return;
        }
        
        // Show code for dirty-harry when acceptance threshold is reached
        // Dirty Harry is always visible to players who have access, but code-locked
        // When threshold is reached, show the code to this player
        if (!GameState.isClueUnlocked('dirty-harry') && GameState.hasClueAccess('dirty-harry')) {
            // Player has access to dirty-harry but it's not unlocked yet
            // Show code 1971 to this player
            const code = '1971';
            this.showModal(
                'Consensus Reached',
                `Your team has reached consensus. Use code ${code} to unlock the Dirty Harry Scenario clue. Share this code with teammates who have access to that clue.`,
                [
                    {
                        text: 'Continue',
                        class: 'modal-button-primary',
                        onclick: 'UI.hideModal()'
                    }
                ]
            );
        } else if (!GameState.isClueUnlocked('dirty-harry')) {
            // Player doesn't have access to dirty-harry, but threshold reached
            // Show code to share with teammate
            const code = '1971';
            this.showModal(
                'Consensus Reached',
                `Your team has reached consensus. A teammate needs code ${code} to unlock the Dirty Harry Scenario clue. Share this code with them.`,
                [
                    {
                        text: 'Continue',
                        class: 'modal-button-primary',
                        onclick: 'UI.hideModal()'
                    }
                ]
            );
        }
        
        // Proceed with form confirmation
        this.showFormConfirmation(formId, formId === 'form-a' ? 'Form A: Enhanced Interrogation' : 'Form B: Psychologist Discussion');
    },

    showAuthorizationCodeModal() {
        const modalContent = `
            <p style="margin-bottom: 1rem;">Enter the authorization code to unlock the Custom Authorization Form.</p>
            <input type="text" 
                   id="auth-code-input" 
                   placeholder="Enter code" 
                   autocomplete="off"
                   maxlength="10"
                   style="width: 100%; padding: 0.75rem; margin: 1rem 0; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-primary); font-family: 'Courier New', monospace; font-size: 1.1rem; text-align: center; letter-spacing: 0.2rem;">
            <p id="auth-code-error" class="error-message" style="display: none; color: var(--text-red); font-size: 0.9rem; margin-top: 0.5rem;"></p>
        `;
        
        this.showModal(
            'Enter Authorization Code',
            modalContent,
            [
                {
                    text: 'Submit',
                    class: 'modal-button-primary',
                    onclick: 'UI.submitAuthorizationCode()'
                },
                {
                    text: 'Cancel',
                    class: 'modal-button-secondary',
                    onclick: 'UI.hideModal()'
                }
            ]
        );
        
        // Focus input and add Enter key handler
        setTimeout(() => {
            const input = document.getElementById('auth-code-input');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        UI.submitAuthorizationCode();
                    }
                });
            }
        }, 100);
    },
    
    submitAuthorizationCode() {
        const input = document.getElementById('auth-code-input');
        const errorEl = document.getElementById('auth-code-error');
        const code = input ? input.value.trim() : '';
        
        if (!code) {
            if (errorEl) {
                errorEl.textContent = 'Please enter a code.';
                errorEl.style.display = 'block';
            }
            return;
        }
        
        if (code === '0999') {
            GameState.unlockClue('custom-form');
            this.hideModal();
            // Refresh form selection screen to show custom form button
            const forms = JSON.parse(localStorage.getItem('formSelections') || '{}');
            this.showFormSelection(forms);
            this.updateClueCount();
            
            // Refresh discovery locations if needed
            if (typeof setupDiscoveryLocations === 'function') {
                setupDiscoveryLocations();
            }
        } else {
            // Show error
            if (errorEl) {
                errorEl.textContent = 'Incorrect code. Try again.';
                errorEl.style.display = 'block';
            }
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    },
    
    returnToMainGame() {
        // Show discovery grid and clue viewer
        const discoveryGrid = document.getElementById('discovery-grid');
        const clueViewer = document.getElementById('clue-viewer');
        const formSelectionView = document.getElementById('form-selection-view');
        const submitBtn = document.getElementById('submit-form-btn');
        
        if (discoveryGrid) discoveryGrid.style.display = 'grid';
        if (clueViewer) clueViewer.style.display = 'block';
        if (formSelectionView) formSelectionView.style.display = 'none';
        
        // Update post-it note visibility and opacity
        if (typeof updatePostItVisibility === 'function') {
            updatePostItVisibility();
        }
        
        // Show manual submit button with appropriate label
        if (submitBtn) {
            const gameCompleted = GameState.isGameCompleted();
            submitBtn.style.display = 'block';
            submitBtn.textContent = gameCompleted ? 'View Results' : 'Submit Authorization Form';
        }
    },

    async selectForm(formId) {
        GameState.setSelectedForm(formId);
        
        // Record finish time once, so the timer freezes at submission
        if (!localStorage.getItem('gameFinishedTime')) {
            localStorage.setItem('gameFinishedTime', Date.now().toString());
        }
        
        GameState.unlockClue('truth');
        
        // Hide other views, show only the truth/outcome screen
        const formSelectionView = document.getElementById('form-selection-view');
        const clueViewer = document.getElementById('clue-viewer');
        const discoveryGrid = document.getElementById('discovery-grid');
        const customFormView = document.getElementById('custom-form-view');
        const submitBtn = document.getElementById('submit-form-btn');
        
        if (formSelectionView) formSelectionView.style.display = 'none';
        if (customFormView) customFormView.style.display = 'none';
        if (clueViewer) clueViewer.style.display = 'block';
        if (discoveryGrid) discoveryGrid.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
        
        // Show truth
        const truthContent = await ClueSystem.loadClueContent('truth');
        
        // Show truth content; outcome (including any custom form) is handled separately
        if (clueViewer) {
            const clue = ClueSystem.getClue('truth');
            const content = truthContent;
            
            clueViewer.innerHTML = `
                <div class="form-selection-header">
                    <button class="back-button" onclick="UI.returnToMainGame()">← Back to Investigation</button>
                </div>
                <div class="clue-header">
                    <h2>${clue.name}</h2>
                </div>
                <div class="clue-content">
                    ${this.renderMarkdown(content)}
                </div>
            `;
            
            // Show outcome
            this.showOutcome(formId);
        }
        
        // Mark game as completed
        localStorage.setItem('gameCompleted', 'true');
        
        // Scroll to top
        window.scrollTo(0, 0);
    },

    showOutcome(formId) {
        const viewer = document.getElementById('clue-viewer');
        if (!viewer) return;
        
        let outcomeHTML = '';
        if (formId === 'form-a') {
            outcomeHTML = `
                <div class="outcome">
                    <h2>Outcome: Enhanced Interrogation Form Selected</h2>
                    <p>If you chose the torture form, you harmed an innocent person.</p>
                    <p>Undergoing torture led Haven to further protect the details of his father's attack.</p>
                    <p>DHS officials were not able to stop the attack and 23 innocent people died.</p>
                </div>
            `;
        } else if (formId === 'form-b') {
            outcomeHTML = `
                <div class="outcome">
                    <h2>Outcome: Discussion Form Selected</h2>
                    <p>If you chose the discussion form, Dr. Shannon Harp succeeded in getting Haven to question his loyalty to the AFF and learned about the bomb and his father.</p>
                    <p>However, Haven will not disclose information about the bomb unless he can be sure that his father will not be tortured.</p>
                    <ul>
                        <li>How could you assure him of this?</li>
                        <li>Is it now permissible to torture Haven to find out the information?</li>
                    </ul>
                </div>
            `;
        } else if (formId === 'form-c') {
            const customFormContent = localStorage.getItem('customFormContent') || '';
            const rawContent = customFormContent || '(No content provided)';
            const safeContent = this.escapeHtml(rawContent);
            outcomeHTML = `
                <div class="outcome">
                    <h2>Outcome: Custom Authorization Form Selected</h2>
                    <p>You created a custom authorization form with the following content:</p>
                    <pre class="custom-form-preview" style="background: var(--bg-darker); border: 2px solid var(--border-color); padding: 1.5rem; margin: 1rem 0; font-family: 'Courier New', monospace; white-space: pre-wrap;">
${safeContent}
                    </pre>
                    <p style="margin-top: 1rem; color: var(--text-amber);">
                        <strong>The game facilitator will now review your custom authorization form and inform you of the outcome based on the specific permissions and rules you included.</strong>
                    </p>
                </div>
            `;
        }
        
        viewer.innerHTML += outcomeHTML;
        
        // Show debrief placeholder
        setTimeout(() => {
            this.showDebriefPlaceholder();
        }, 2000);
    },

    showDebriefPlaceholder() {
        const viewer = document.getElementById('clue-viewer');
        if (!viewer) return;
        
        const debriefHTML = `
            <div class="debrief-placeholder">
                <h2>Debrief</h2>
                <p>The debrief section will be added in a future update.</p>
                <p>Thank you for playing the Ethics Escape Room.</p>
            </div>
        `;
        
        viewer.innerHTML += debriefHTML;
    },

    animateClueDiscovery(element) {
        if (element) {
            element.classList.add('discovering');
            setTimeout(() => {
                element.classList.remove('discovering');
            }, 500);
        }
    },

    // Modal functions
    showModal(title, message, buttons) {
        const overlay = document.getElementById('modal-overlay');
        const modalBody = document.getElementById('modal-body');
        
        if (!overlay || !modalBody) return;
        
        let buttonsHTML = '';
        if (buttons && buttons.length > 0) {
            buttonsHTML = buttons.map(btn => 
                `<button class="modal-button ${btn.class || ''}" onclick="${btn.onclick}">${btn.text}</button>`
            ).join('');
        }
        
        modalBody.innerHTML = `
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="modal-buttons">
                ${buttonsHTML}
            </div>
        `;
        
        overlay.style.display = 'flex';
        
        // Close on overlay click (but not on modal content click)
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.hideModal();
            }
        };
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    },

    hideModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    showResetConfirmation() {
        this.showModal(
            'Reset Game',
            'Are you sure you want to reset the game? This will clear all progress, discovered clues, and timer. You will need to start from the beginning.',
            [
                {
                    text: 'Cancel',
                    class: 'modal-button-secondary',
                    onclick: 'UI.hideModal()'
                },
                {
                    text: 'Reset Game',
                    class: 'modal-button-primary',
                    onclick: 'UI.confirmReset()'
                }
            ]
        );
    },

    confirmReset() {
        // Clear all game state including team data
        GameState.startNewGame();
        GameState.resetTeam();
        
        // Redirect to index
        window.location.href = 'index.html';
    },

    showFormConfirmation(formId, formName) {
        // Check thoroughness one more time
        const thoroughness = GameState.checkThoroughness();
        if (thoroughness.shouldWarn) {
            this.showModal(
                'Thoroughness Warning',
                thoroughness.message,
                [
                    // {
                    //     text: 'Continue Anyway',
                    //     class: 'modal-button-primary',
                    //     onclick: `UI.hideModal(); UI.showFormConfirmationFinal('${formId}', '${formName}')`
                    // },
                    {
                        text: 'Go Back',
                        class: 'modal-button-secondary',
                        onclick: 'UI.hideModal()'
                    }
                ]
            );
            return;
        }
        
        this.showFormConfirmationFinal(formId, formName);
    },
    
    showFormConfirmationFinal(formId, formName) {
        this.showModal(
            'Confirm Form Selection',
            `Are you sure you want to submit ${formName}? This will end the game and reveal the truth.`,
            [
                {
                    text: 'Cancel',
                    class: 'modal-button-secondary',
                    onclick: 'UI.hideModal()'
                },
                {
                    text: 'Submit Form',
                    class: 'modal-button-primary',
                    onclick: `UI.hideModal(); UI.selectForm('${formId}')`
                }
            ]
        );
    },
    
    showCustomFormBuilder() {
        const formSelectionView = document.getElementById('form-selection-view');
        const customFormView = document.getElementById('custom-form-view');
        
        if (formSelectionView) formSelectionView.style.display = 'none';
        if (!customFormView) return;
        
        const team = GameState.getTeam();
        const gameCompleted = GameState.isGameCompleted();
        const customFormData = JSON.parse(localStorage.getItem('customFormData') || '{}');
        const customFormContent = localStorage.getItem('customFormContent') || '';
        
        // Build team sign-off slots
        const signOffSlotsHTML = team.members.map((member, index) => {
            const signOff = customFormData.signOffs && customFormData.signOffs[member] || { support: '', reason: '' };
            const selectDisabledAttr = gameCompleted ? 'disabled' : '';
            const textareaReadonlyAttr = gameCompleted ? 'readonly' : '';
            const selectOnChange = gameCompleted ? '' : `onchange="UI.updateSignOff('${member}', this.value, document.getElementById('signoff-reason-${index}').value, ${index})"`;
            const textareaOnChange = gameCompleted ? '' : `onchange="UI.updateSignOff('${member}', document.getElementById('signoff-support-${index}').value, this.value, ${index})"`;
            return `
                <div class="team-slot" style="background: var(--bg-darker); border: 2px solid var(--border-color); padding: 1.5rem; margin-bottom: 1rem;">
                    <h3 style="color: var(--text-amber); margin-top: 0;">${member}</h3>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Support/Reject:</label>
                        <select id="signoff-support-${index}" 
                                style="width: 100%; padding: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-primary); font-family: 'Courier New', monospace;"
                                ${selectOnChange} ${selectDisabledAttr}>
                            <option value="">Select...</option>
                            <option value="support" ${signOff.support === 'support' ? 'selected' : ''}>Support</option>
                            <option value="reject" ${signOff.support === 'reject' ? 'selected' : ''}>Reject</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Why ${member} supports/rejects:</label>
                        <textarea id="signoff-reason-${index}" 
                                  rows="3" 
                                  style="width: 100%; padding: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-primary); font-family: 'Courier New', monospace; resize: vertical;"
                                  placeholder="Enter reason (at least 5 words)..."
                                  ${textareaOnChange} ${textareaReadonlyAttr}>${signOff.reason}</textarea>
                        <p id="signoff-reason-error-${index}" class="error-message" style="display: none; color: var(--text-red); font-size: 0.9rem; margin-top: 0.5rem;"></p>
                    </div>
                </div>
            `;
        }).join('');
        
        // Calculate acceptance status for custom form
        const acceptanceStatus = this.checkCustomFormAcceptance(customFormData.signOffs || {}, team);
        
        const customFormButtonLabel = gameCompleted ? 'View Results' : 'Submit Custom Form';
        const customFormButtonOnClick = gameCompleted ? 'UI.viewFinalResults()' : 'UI.submitCustomForm()';
        const customFormButtonDisabled = gameCompleted ? '' : (acceptanceStatus.canSubmit ? '' : 'disabled');
        const customFormButtonBackground = gameCompleted
            ? 'var(--accent-green)'
            : (acceptanceStatus.canSubmit ? 'var(--accent-green)' : 'var(--bg-darker)');
        const customFormButtonCursor = gameCompleted ? 'pointer' : (acceptanceStatus.canSubmit ? 'pointer' : 'not-allowed');
        const customFormButtonOpacity = gameCompleted ? '1' : (acceptanceStatus.canSubmit ? '1' : '0.5');
        
        customFormView.innerHTML = `
            <div class="form-selection-header">
                <button class="back-button" onclick="UI.returnToFormSelection()">← Back to Form Selection</button>
                <h2>Custom Authorization Form</h2>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    Create your custom authorization form and get team sign-offs.
                </p>
                <div style="background: var(--bg-darker); border-left: 4px solid var(--text-amber); padding: 1rem; margin-bottom: 1.5rem;">
                    <p style="margin: 0; color: var(--text-primary);">
                        <strong>Acceptance Status:</strong> ${acceptanceStatus.message}
                    </p>
                </div>
            </div>
            <div style="background: var(--bg-darker); border: 2px solid var(--border-color); padding: 1.5rem; margin-bottom: 2rem;">
                <h3 style="color: var(--text-amber); margin-top: 0;">Form Content</h3>
                <textarea id="custom-form-content-input" 
                          rows="15" 
                          style="width: 100%; padding: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-primary); font-family: 'Courier New', monospace; resize: vertical;"
                          placeholder="Enter your custom authorization form content here (at least 5 words)..."
                          ${gameCompleted ? 'readonly' : 'onchange="UI.updateCustomFormContent(this.value)"'}>${customFormContent}</textarea>
                <p id="custom-form-content-error" class="error-message" style="display: none; color: var(--text-red); font-size: 0.9rem; margin-top: 0.5rem;"></p>
            </div>
            <div>
                <h3 style="color: var(--text-amber);">Team Sign-Offs</h3>
                ${signOffSlotsHTML}
            </div>
            <div style="text-align: center; margin-top: 2rem;">
                <button onclick="${customFormButtonOnClick}" 
                        id="submit-custom-form-btn"
                        ${customFormButtonDisabled}
                        style="padding: 1rem 2rem; background: ${customFormButtonBackground}; border: none; color: var(--text-primary); font-family: 'Courier New', monospace; font-size: 1.1rem; cursor: ${customFormButtonCursor}; text-transform: uppercase; opacity: ${customFormButtonOpacity};">
                    ${customFormButtonLabel}
                </button>
            </div>
        `;
        customFormView.style.display = 'block';
        
        // Scroll to top
        window.scrollTo(0, 0);
    },
    
    updateCustomFormContent(content) {
        localStorage.setItem('customFormContent', content);
        const customFormData = JSON.parse(localStorage.getItem('customFormData') || '{}');
        customFormData.content = content;
        localStorage.setItem('customFormData', JSON.stringify(customFormData));
        
        // Validate form content
        this.validateCustomFormContent(content);
        
        // Refresh acceptance status and button state
        this.refreshCustomFormUI();
    },
    
    refreshCustomFormUI() {
        const customFormData = JSON.parse(localStorage.getItem('customFormData') || '{}');
        const team = GameState.getTeam();
        const customFormContent = localStorage.getItem('customFormContent') || '';
        
        // Check if form content is valid (5+ words)
        const contentWordCount = customFormContent.trim().split(/\s+/).filter(w => w.length > 0).length;
        const contentValid = contentWordCount >= 5;
        
        // Check if all sign-offs are valid
        let allSignOffsValid = true;
        team.members.forEach((member, index) => {
            const signOff = customFormData.signOffs && customFormData.signOffs[member];
            if (!signOff || !signOff.reason) {
                allSignOffsValid = false;
            } else {
                const reasonWordCount = signOff.reason.trim().split(/\s+/).filter(w => w.length > 0).length;
                if (reasonWordCount < 5) {
                    allSignOffsValid = false;
                }
            }
        });
        
        // Calculate acceptance status
        const acceptanceStatus = this.checkCustomFormAcceptance(customFormData.signOffs || {}, team);
        
        // Update acceptance status message
        const statusEl = document.querySelector('#custom-form-view .form-selection-header p');
        if (statusEl && statusEl.textContent.includes('Acceptance Status')) {
            statusEl.innerHTML = `<strong>Acceptance Status:</strong> ${acceptanceStatus.message}`;
        }
        
        // Update submit button state (only enable if content valid, all sign-offs valid, and threshold met)
        const submitBtn = document.getElementById('submit-custom-form-btn');
        if (submitBtn) {
            const canSubmit = contentValid && allSignOffsValid && acceptanceStatus.canSubmit;
            submitBtn.disabled = !canSubmit;
            submitBtn.style.background = canSubmit ? 'var(--accent-green)' : 'var(--bg-darker)';
            submitBtn.style.cursor = canSubmit ? 'pointer' : 'not-allowed';
            submitBtn.style.opacity = canSubmit ? '1' : '0.5';
        }
    },
    
    validateCustomFormContent(content) {
        const errorEl = document.getElementById('custom-form-content-error');
        if (!errorEl) return;
        
        const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        
        if (wordCount < 5) {
            errorEl.textContent = 'Form content must be at least 5 words long.';
            errorEl.style.display = 'block';
        } else {
            errorEl.style.display = 'none';
        }
    },
    
    updateSignOff(memberName, support, reason, index) {
        const customFormData = JSON.parse(localStorage.getItem('customFormData') || '{}');
        if (!customFormData.signOffs) {
            customFormData.signOffs = {};
        }
        customFormData.signOffs[memberName] = { support, reason };
        localStorage.setItem('customFormData', JSON.stringify(customFormData));
        
        // Validate reason
        this.validateSignOffReason(memberName, reason, index, customFormData.signOffs);
        
        // Refresh acceptance status and button state
        this.refreshCustomFormUI();
    },
    
    validateSignOffReason(memberName, reason, index, signOffs) {
        const errorEl = document.getElementById(`signoff-reason-error-${index}`);
        if (!errorEl) return;
        
        const errors = [];
        
        // Check word count (at least 5 words)
        const wordCount = reason.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 5) {
            errors.push('Reason must be at least 5 words long.');
        }
        
        // Check for duplicates
        const team = GameState.getTeam();
        const otherMembers = team.members.filter(m => m !== memberName);
        otherMembers.forEach(otherMember => {
            const otherSignOff = signOffs[otherMember];
            if (otherSignOff && otherSignOff.reason && 
                reason.trim().toLowerCase() === otherSignOff.reason.trim().toLowerCase()) {
                errors.push(`Reason cannot be identical to ${otherMember}'s reason.`);
            }
        });
        
        // Display errors
        if (errors.length > 0) {
            errorEl.textContent = errors.join(' ');
            errorEl.style.display = 'block';
        } else {
            errorEl.style.display = 'none';
        }
    },
    
    checkCustomFormAcceptance(signOffs, team) {
        // Count supports and rejects
        const supportCount = Object.values(signOffs).filter(s => s.support === 'support').length;
        const rejectCount = Object.values(signOffs).filter(s => s.support === 'reject').length;
        
        // Calculate threshold (same as form selection)
        let threshold;
        if (team.size === 1) {
            threshold = 1;
        } else if (team.size === 2) {
            threshold = 2;
        } else {
            threshold = team.size - 1;
        }
        
        // Check if threshold is met (supports must meet threshold)
        const canSubmit = supportCount >= threshold;
        
        let message;
        if (canSubmit) {
            message = `Acceptance threshold met (${supportCount}/${team.size} players support).`;
        } else {
            message = `Need ${threshold} players to support. Currently: ${supportCount}/${team.size} players support.`;
        }
        
        return {
            canSubmit,
            threshold,
            supportCount,
            rejectCount,
            message
        };
    },
    
    submitCustomForm() {
        const customFormData = JSON.parse(localStorage.getItem('customFormData') || '{}');
        const team = GameState.getTeam();
        const customFormContent = localStorage.getItem('customFormContent') || '';
        
        // Validate form content
        const contentWordCount = customFormContent.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (contentWordCount < 5) {
            const errorEl = document.getElementById('custom-form-content-error');
            if (errorEl) {
                errorEl.textContent = 'Form content must be at least 5 words long.';
                errorEl.style.display = 'block';
            }
            // Scroll to error
            if (errorEl) {
                errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Validate all sign-off reasons
        let allValid = true;
        team.members.forEach((member, index) => {
            const signOff = customFormData.signOffs && customFormData.signOffs[member];
            if (!signOff || !signOff.reason) {
                allValid = false;
                const errorEl = document.getElementById(`signoff-reason-error-${index}`);
                if (errorEl) {
                    errorEl.textContent = 'Reason is required.';
                    errorEl.style.display = 'block';
                }
            } else {
                this.validateSignOffReason(member, signOff.reason, index, customFormData.signOffs || {});
                const errorEl = document.getElementById(`signoff-reason-error-${index}`);
                if (errorEl && errorEl.style.display !== 'none') {
                    allValid = false;
                }
            }
        });
        
        if (!allValid) {
            // Scroll to first error
            const firstError = document.querySelector('#custom-form-view .error-message[style*="block"]');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        const acceptanceStatus = this.checkCustomFormAcceptance(customFormData.signOffs || {}, team);
        
        if (!acceptanceStatus.canSubmit) {
            return;
        }
        
        // Check thoroughness
        const thoroughness = GameState.checkThoroughness();
        if (thoroughness.shouldWarn) {
            this.showModal(
                'Thoroughness Warning',
                thoroughness.message,
                [
                    {
                        text: 'Continue Anyway',
                        class: 'modal-button-primary',
                        onclick: `UI.hideModal(); UI.showFormConfirmationFinal('form-c', 'Form C: Custom Authorization')`
                    },
                    {
                        text: 'Go Back',
                        class: 'modal-button-secondary',
                        onclick: 'UI.hideModal()'
                    }
                ]
            );
            return;
        }
        
        this.showFormConfirmationFinal('form-c', 'Form C: Custom Authorization');
    },
    
    returnToFormSelection() {
        const customFormView = document.getElementById('custom-form-view');
        const formSelectionView = document.getElementById('form-selection-view');
        
        if (customFormView) customFormView.style.display = 'none';
        if (formSelectionView) {
            const forms = [
                { id: 'form-a', name: 'Form A: Enhanced Interrogation', preview: 'Authorizes enhanced interrogation techniques.' },
                { id: 'form-b', name: 'Form B: Psychologist Discussion', preview: 'Authorizes psychologist discussion.' }
            ];
            this.showFormSelection(forms);
        }
    }
};
