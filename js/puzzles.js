/**
 * Interactive puzzle implementations
 */

const Puzzles = {
    async showBenthamScales() {
        // Always show the puzzle, but conditionally show advisor content
        const hasAdvisor = GameState.isClueUnlocked('advisor');
        let advisorContentHTML = '';
        
        if (hasAdvisor) {
            // Load advisor content to show for reference
            const advisorContent = await ClueSystem.loadClueContent('advisor');
            advisorContentHTML = `
                <div style="background: var(--bg-darker); border-left: 4px solid var(--text-amber); padding: 1rem; margin: 1rem 0;">
                    <h3 style="color: var(--text-amber); margin-top: 0;">Advisor Assessment (Reference)</h3>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${UI.renderMarkdown(advisorContent)}
                    </div>
                </div>
            `;
        } else {
            // Show message that advisor assessment is needed
            advisorContentHTML = `
                <div style="background: var(--bg-darker); border-left: 4px solid var(--warning); padding: 1rem; margin: 1rem 0;">
                    <p style="color: var(--text-secondary); margin: 0;">
                        <strong>Note:</strong> You need to receive the advisor's assessment first before you can complete this worksheet. 
                        Look for the Secure Pager to establish a connection and receive the advisor's transmission. 
                        Once you have the advisor's assessment, you can use it to quantify the threat on the scales below.
                    </p>
                </div>
            `;
        }
        
        const html = `
            <div class="bentham-puzzle">
                <p>Use the scales below to quantify the advisor's assessment of the bomb threat according to its perceived intensity, duration, certainty, and nearness.</p>
                
                ${advisorContentHTML}
                
                <p style="margin-top: 1.5rem;"><strong>Rate the threat on each scale:</strong></p>
                
                <div class="scale-input">
                    <label>Intensity (1-5): How severe would the consequences be?</label>
                    <input type="range" id="intensity" min="1" max="5" value="3" oninput="Puzzles.updateBenthamValue('intensity', this.value)">
                    <input type="number" id="intensity-value" min="1" max="5" value="3" onchange="Puzzles.updateBenthamSlider('intensity', this.value)">
                </div>
                
                <div class="scale-input">
                    <label>Duration (1-5): How long would the consequences last?</label>
                    <input type="range" id="duration" min="1" max="5" value="3" oninput="Puzzles.updateBenthamValue('duration', this.value)">
                    <input type="number" id="duration-value" min="1" max="5" value="3" onchange="Puzzles.updateBenthamSlider('duration', this.value)">
                </div>
                
                <div class="scale-input">
                    <label>Certainty (1-5): How certain is the threat?</label>
                    <input type="range" id="certainty" min="1" max="5" value="3" oninput="Puzzles.updateBenthamValue('certainty', this.value)">
                    <input type="number" id="certainty-value" min="1" max="5" value="3" onchange="Puzzles.updateBenthamSlider('certainty', this.value)">
                </div>
                
                <div class="scale-input">
                    <label>Nearness (1-5): How soon will the consequences occur?</label>
                    <input type="range" id="nearness" min="1" max="5" value="3" oninput="Puzzles.updateBenthamValue('nearness', this.value)">
                    <input type="number" id="nearness-value" min="1" max="5" value="3" onchange="Puzzles.updateBenthamSlider('nearness', this.value)">
                </div>
                
                <button onclick="Puzzles.submitBenthamScales()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: 'Courier New', monospace; cursor: pointer;">
                    Submit Assessment
                </button>
                <p id="bentham-error" class="error-message" style="display:none;"></p>
            </div>
        `;
        
        UI.showPuzzle('bentham', html);
    },
    
    updateBenthamValue(name, value) {
        const valueInput = document.getElementById(`${name}-value`);
        if (valueInput) valueInput.value = value;
    },
    
    updateBenthamSlider(name, value) {
        const slider = document.getElementById(name);
        if (slider) slider.value = value;
    },
    
    async submitBenthamScales() {
        const answers = {
            intensity: parseInt(document.getElementById('intensity').value),
            duration: parseInt(document.getElementById('duration').value),
            certainty: parseInt(document.getElementById('certainty').value),
            nearness: parseInt(document.getElementById('nearness').value)
        };
        
        const errorEl = document.getElementById('bentham-error');
        
        if (ClueSystem.validateBenthamScales(answers)) {
            // Correct! Unlock Bentham; Steinhoff becomes available via its 'requires' on Bentham
            GameState.unlockClue('bentham');
            localStorage.setItem('benthamAnswers', JSON.stringify(answers));
            
            // Show success message and unlock Steinhoff
            const viewer = document.getElementById('clue-viewer');
            if (viewer) {
                viewer.innerHTML += `
                    <div style="background: var(--accent-green); border: 2px solid var(--text-amber); padding: 1rem; margin-top: 1rem;">
                        <p style="color: var(--text-primary); margin: 0;">
                            <strong>Assessment Complete!</strong> Your quantification matches the advisor's analysis. 
                            The Steinhoff definitions are now available.
                        </p>
                    </div>
                `;
            }
            
            UI.updateClueCount();
            
            // Refresh discovery locations to show Steinhoff
            if (typeof setupDiscoveryLocations === 'function') {
                setupDiscoveryLocations();
            }
        } else {
            // Incorrect
            if (errorEl) {
                errorEl.textContent = 'Your assessment does not match the advisor\'s analysis. Review the advisor\'s transmission and try again.';
                errorEl.style.display = 'block';
            }
        }
    },
    
    async showSteinhoffMatching() {
        // Load definitions
        const definitionsResponse = await fetch('original/steinhoff-definitions.md');
        const definitionsText = await definitionsResponse.text();
        
        // Load examples
        const examplesResponse = await fetch('original/steinhoff.md');
        const examplesText = await examplesResponse.text();
        
        const html = `
            <div class="steinhoff-puzzle">
                <p>Match each example to the correct concept. The numbers from correctly matched examples will form the key.</p>
                
                <div class="matching-puzzle">
                    <div>
                        <h3>Definitions</h3>
                        <div id="definitions-list">
                            ${this.renderDefinitions(definitionsText)}
                        </div>
                    </div>
                    <div>
                        <h3>Examples</h3>
                        <div id="examples-list">
                            ${this.renderExamples(examplesText)}
                        </div>
                    </div>
                </div>
                
                <button onclick="Puzzles.submitSteinhoffMatching()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: 'Courier New', monospace; cursor: pointer;">
                    Submit Matching
                </button>
                <p id="steinhoff-error" class="error-message" style="display:none;"></p>
            </div>
        `;
        
        UI.showPuzzle('steinhoff', html);
    },
    
    renderDefinitions(text) {
        const lines = text.split('\n');
        const definitions = [];
        let currentDef = null;
        
        lines.forEach(line => {
            if (line.startsWith('## ')) {
                if (currentDef) definitions.push(currentDef);
                currentDef = {
                    name: line.substring(3).trim(),
                    description: ''
                };
            } else if (currentDef && line.trim()) {
                currentDef.description += line.trim() + ' ';
            }
        });
        if (currentDef) definitions.push(currentDef);
        
        return definitions.map((def, idx) => `
            <div class="match-item" data-def="${def.name}">
                <strong>${def.name}</strong>
                <p>${def.description}</p>
                <select id="def-${idx}" onchange="Puzzles.selectSteinhoffMatch('${def.name}', this.value)">
                    <option value="">Select example...</option>
                    <option value="0">Example 0</option>
                    <option value="1">Example 1</option>
                    <option value="3">Example 3</option>
                    <option value="7">Example 7</option>
                </select>
            </div>
        `).join('');
    },
    
    renderExamples(text) {
        const lines = text.split('\n');
        const examples = [];
        
        lines.forEach(line => {
            if (line.startsWith('> (')) {
                const match = line.match(/> \((\d+)\) (.+)/);
                if (match) {
                    examples.push({
                        number: match[1],
                        text: match[2]
                    });
                }
            }
        });
        
        return examples.map(ex => `
            <div class="match-item" data-example="${ex.number}">
                <strong>Example ${ex.number}</strong>
                <p>${ex.text}</p>
            </div>
        `).join('');
    },
    
    selectSteinhoffMatch(defName, exampleNum) {
        // Store selection
        if (!window.steinhoffMatches) window.steinhoffMatches = {};
        window.steinhoffMatches[defName] = exampleNum;
    },
    
    async submitSteinhoffMatching() {
        const matches = window.steinhoffMatches || {};
        const errorEl = document.getElementById('steinhoff-error');
        
        if (ClueSystem.validateSteinhoffMatching(matches)) {
            // Correct! All four definitions are matched to the right examples
            GameState.unlockClue('steinhoff');
            localStorage.setItem('steinhoffMatches', JSON.stringify(matches));
            
            // Show a brief success message in the current view
            const viewer = document.getElementById('clue-viewer');
            if (viewer) {
                viewer.innerHTML += `
                    <div style="background: var(--accent-green); border: 2px solid var(--text-amber); padding: 1rem; margin-top: 1rem;">
                        <p style="color: var(--text-primary); margin: 0;">
                            <strong>Matching Complete!</strong> You have correctly matched Steinhoff's definitions to their examples.
                            The Historical Records puzzle is now available in the discovery grid.
                        </p>
                    </div>
                `;
            }
            UI.updateClueCount();
            
            // Refresh discovery locations to show historical records
            if (typeof setupDiscoveryLocations === 'function') {
                setupDiscoveryLocations();
            }
        } else {
            if (errorEl) {
                errorEl.textContent = 'Incorrect matching. Review the definitions and examples.';
                errorEl.style.display = 'block';
            }
        }
    },
    
    async showHistoricalRecords() {
        const recordsResponse = await fetch('original/records.md');
        const recordsText = await recordsResponse.text();
        
        const html = `
            <div class="historical-records-puzzle">
                <p>Read through the historical records below. For each record, classify the subject according to Shue's three types:</p>
                <ul>
                    <li><strong>RC</strong> - Ready Collaborator: Immediately cooperates</li>
                    <li><strong>IB</strong> - Innocent Bystander: Not involved, wrongly accused</li>
                    <li><strong>DE</strong> - Dedicated Enemy: Committed to the cause, won't cooperate</li>
                </ul>
                <p>Count how many of each type to form the unlock code.</p>
                
                <div class="classification-puzzle">
                    ${this.renderRecords(recordsText)}
                </div>
                
                <button onclick="Puzzles.submitHistoricalRecords()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: 'Courier New', monospace; cursor: pointer;">
                    Submit Classification
                </button>
                <p id="records-error" class="error-message" style="display:none;"></p>
            </div>
        `;
        
        UI.showPuzzle('historical-records', html);
    },
    
    renderRecords(text) {
        const lines = text.split('\n');
        const records = [];
        let currentRecord = null;
        
        lines.forEach(line => {
            if (line.startsWith('Subject (age')) {
                if (currentRecord) records.push(currentRecord);
                currentRecord = {
                    header: line,
                    text: ''
                };
            } else if (currentRecord && line.trim() && !line.startsWith('>')) {
                currentRecord.text += line.trim() + ' ';
            }
        });
        if (currentRecord) records.push(currentRecord);
        
        return records.map((record, idx) => `
            <div class="record-item">
                <p><strong>${record.header}</strong></p>
                <p>${record.text}</p>
                <select id="record-${idx}" onchange="Puzzles.selectRecordClassification(${idx}, this.value)">
                    <option value="">Select classification...</option>
                    <option value="RC">Ready Collaborator (RC)</option>
                    <option value="IB">Innocent Bystander (IB)</option>
                    <option value="DE">Dedicated Enemy (DE)</option>
                </select>
            </div>
        `).join('');
    },
    
    selectRecordClassification(index, classification) {
        if (!window.historicalRecords) window.historicalRecords = [];
        window.historicalRecords[index] = classification;
    },
    
    async submitHistoricalRecords() {
        const classifications = window.historicalRecords || [];
        const errorEl = document.getElementById('records-error');
        
        // First check if all records are classified
        if (classifications.length !== 5) {
            if (errorEl) {
                errorEl.textContent = 'Please classify all records.';
                errorEl.style.display = 'block';
            }
            return;
        }
        
        // Then validate the classifications are correct
        if (ClueSystem.validateHistoricalRecords(classifications)) {
            const code = ClueSystem.getHistoricalRecordsCode(classifications);
            
            // Only unlock Historical Records when its own puzzle is solved;
            // Intervening Action becomes available via its 'requires' on historical-records
            GameState.unlockClue('historical-records');
            localStorage.setItem('historicalRecords', JSON.stringify(classifications));
            
            // Show historical records content
            const content = await ClueSystem.loadClueContent('historical-records');
            UI.showClue('historical-records', content);
            UI.updateClueCount();
            
            // Refresh discovery locations so Intervening Action appears
            if (typeof setupDiscoveryLocations === 'function') {
                setupDiscoveryLocations();
            }
        } else {
            if (errorEl) {
                errorEl.textContent = 'Incorrect classifications. Review Shue\'s definitions and try again.';
                errorEl.style.display = 'block';
            }
        }
    },
    
    async showInterveningAction() {
        const interveningResponse = await fetch('original/intervening.md');
        const interveningText = await interveningResponse.text();
        
        const html = `
            <div class="intervening-action-puzzle">
                <p>Read the principle and the statements below. Select which statements are supported by the principle of intervening action.</p>
                
                <blockquote>
                    <strong>The Principle of Intervening Action:</strong><br>
                    We are responsible for our actions, even if someone else caused us to act that way. 
                    We are not responsible for the consequences of actions taken by others because of us.
                </blockquote>
                
                <div class="statements-list">
                    ${this.renderStatements(interveningText)}
                </div>
                
                <button onclick="Puzzles.submitInterveningAction()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: 'Courier New', monospace; cursor: pointer;">
                    Submit Selection
                </button>
                <p id="intervening-error" class="error-message" style="display:none;"></p>
            </div>
        `;
        
        UI.showPuzzle('intervening-action', html);
    },
    
    renderStatements(text) {
        const lines = text.split('\n');
        const statements = [];
        
        lines.forEach(line => {
            if (line.startsWith('> ')) {
                const match = line.match(/> (\d+)\. (.+)/);
                if (match) {
                    statements.push({
                        number: match[1],
                        text: match[2]
                    });
                }
            }
        });
        
        return statements.map(stmt => `
            <div class="record-item">
                <label style="display: flex; align-items: start; cursor: pointer;">
                    <input type="checkbox" value="${stmt.number}" onchange="Puzzles.toggleInterveningStatement('${stmt.number}', this.checked)" style="margin-right: 1rem; margin-top: 0.3rem;">
                    <div>
                        <strong>Statement ${stmt.number}</strong>
                        <p>${stmt.text}</p>
                    </div>
                </label>
            </div>
        `).join('');
    },
    
    toggleInterveningStatement(number, checked) {
        if (!window.interveningStatements) window.interveningStatements = [];
        if (checked) {
            if (!window.interveningStatements.includes(number)) {
                window.interveningStatements.push(number);
            }
        } else {
            window.interveningStatements = window.interveningStatements.filter(n => n !== number);
        }
    },
    
    async submitInterveningAction() {
        const selected = window.interveningStatements || [];
        const errorEl = document.getElementById('intervening-error');
        
        if (selected.length === 0) {
            if (errorEl) {
                errorEl.textContent = 'Please select at least one statement.';
                errorEl.style.display = 'block';
            }
            return;
        }
        
        if (ClueSystem.validateInterveningAction(selected)) {
            GameState.unlockClue('intervening-action');
            // We also have to unlock the pamphlet here so that it can be accessed.
            GameState.unlockClue('pamphlet');
            localStorage.setItem('interveningAction', JSON.stringify(selected));
            
            // Show pamphlet (unlock with code from selected statements)
            // The pamphlet key is "87", so if statement 87 is selected, use that
            // Otherwise, try to decode with the selected statement numbers
            const pamphletContent = await ClueSystem.loadClueContent('pamphlet');
            UI.showClue('pamphlet', pamphletContent);
            UI.updateClueCount();
            
            // Refresh discovery locations to show pamphlet
            if (typeof setupDiscoveryLocations === 'function') {
                setupDiscoveryLocations();
            }
        } else {
            if (errorEl) {
                errorEl.textContent = 'Incorrect selection. Review the principle and statements.';
                errorEl.style.display = 'block';
            }
        }
    },
    
    async showDirtyHarry() {
        const html = `
            <div class="dirty-harry-puzzle">
                <p>A Dirty Harry scenario occurs when:</p>
                <ol>
                    <li>A normally lawful person believes the only way for them to carry out</li>
                    <li>Their legal mandate is to</li>
                    <li>Take an action that is not morally permissible</li>
                </ol>
                <p>Write an imaginary story where such a scenario emerges based on your chosen authorization form.</p>
                
                <textarea id="dirty-harry-story" rows="10" style="width: 100%; background: var(--bg-darker); border: 2px solid var(--border-color); color: var(--text-primary); padding: 1rem; font-family: 'Courier New', monospace; margin: 1rem 0;"></textarea>
                
                <button onclick="Puzzles.submitDirtyHarry()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: 'Courier New', monospace; cursor: pointer;">
                    Submit Story
                </button>
                <p id="dirty-harry-error" class="error-message" style="display:none;"></p>
                <p id="dirty-harry-feedback" style="display:none; color: var(--text-amber); margin-top: 1rem;"></p>
            </div>
        `;
        
        UI.showPuzzle('dirty-harry', html);
    },
    
    async submitDirtyHarry() {
        const story = document.getElementById('dirty-harry-story').value.trim();
        const errorEl = document.getElementById('dirty-harry-error');
        const feedbackEl = document.getElementById('dirty-harry-feedback');
        
        if (!story) {
            if (errorEl) {
                errorEl.textContent = 'Please write a story.';
                errorEl.style.display = 'block';
            }
            return;
        }
        
        if (ClueSystem.validateDirtyHarryStory(story)) {
            // Correct!
            GameState.unlockClue('dirty-harry');
            // We also have to unlock the custom form here so that it can be accessed.
            GameState.unlockClue('custom-form');
            localStorage.setItem('dirtyHarryStory', story);
            
            // Show success message - form builder is on the form selection screen
            const html = `
                <div class="custom-form-container">
                    <h2>Custom Authorization Form Unlocked</h2>
                    <p style="color: var(--text-amber); font-size: 1.1rem; margin: 1rem 0;">
                        ✓ Your Dirty Harry scenario has been accepted.
                    </p>
                    <p style="color: var(--text-secondary); margin: 1rem 0;">
                        The Custom Authorization Form option is now available. When you're ready to submit an authorization form, 
                        you can create your own custom form with any permissions and rules you want.
                    </p>
                    <p style="color: var(--text-secondary); margin-top: 1rem;">
                        Go to the form selection screen to access the custom form builder.
                    </p>
                </div>
            `;
            
            UI.showPuzzle('custom-form', html);
            UI.updateClueCount();
            
            // Refresh discovery locations so Dirty Harry shows as completed
            if (typeof setupDiscoveryLocations === 'function') {
                setupDiscoveryLocations();
            }
        } else {
            // Provide feedback
            const lowerStory = story.toLowerCase();
            const missing = [];
            if (!/lawful|legal|authorized|official/.test(lowerStory)) missing.push('normally lawful person');
            if (!/mandate|duty|responsibility|required|must/.test(lowerStory)) missing.push('legal mandate');
            if (!/immoral|wrong|unethical|not.*permissible|forbidden/.test(lowerStory)) missing.push('action not morally permissible');
            
            if (feedbackEl) {
                feedbackEl.textContent = `Your story is missing: ${missing.join(', ')}. Please revise and try again.`;
                feedbackEl.style.display = 'block';
            }
        }
    }
};
