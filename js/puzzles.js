/**
 * Interactive puzzle implementations
 */

// Configuration for Bentham's threat assessment scales
const BenthamScaleConfig = {
    intensity: {
        name: 'intensity',
        title: 'Intensity Rating',
        prompt: 'How intense do they think the consequences will be?',
        min: 1,
        max: 5,
        defaultValue: 3,
        levels: [
            { value: 1, shortLabel: 'Very tolerable' },
            { value: 2, shortLabel: 'Somewhat tolerable' },
            { value: 3, shortLabel: 'Cannot be determined' },
            { value: 4, shortLabel: 'Somewhat painful' },
            { value: 5, shortLabel: 'Very painful'  }
        ]
    },
    duration: {
        name: 'duration',
        title: 'Duration Rating',
        prompt: 'How long do they think the consequences will last?',
        min: 1,
        max: 5,
        defaultValue: 3,
        levels: [
            { value: 1, shortLabel: 'Very short time' },
            { value: 2, shortLabel: 'Somewhat short time' },
            { value: 3, shortLabel: 'Cannot be determined' },
            { value: 4, shortLabel: 'Somewhat long time' },
            { value: 5, shortLabel: 'Very long time' },
        ]
    },
    certainty: {
        name: 'certainty',
        title: 'Certainty Rating',
        prompt: 'How sure are they that the threat will occur?',
        min: 1,
        max: 5,
        defaultValue: 3,
        levels: [
            { value: 1, shortLabel: 'Very unlikely' },
            { value: 2, shortLabel: 'Somewhat unlikely' },
            { value: 3, shortLabel: 'Cannot be determined' },
            { value: 4, shortLabel: 'Somewhat likely' },
            { value: 5, shortLabel: 'Very likely'  }
        ]
    },
    nearness: {
        name: 'nearness',
        title: 'Nearness Rating',
        prompt: 'How close do they think the threat is occurring?',
        min: 1,
        max: 5,
        defaultValue: 3,
        levels: [
            { value: 1, shortLabel: 'Very far' },
            { value: 2, shortLabel: 'Somewhat far' },
            { value: 3, shortLabel: 'Cannot be determined' },
            { value: 4, shortLabel: 'Somewhat close' },
            { value: 5, shortLabel: 'Very close'  }
        ]
    }
};

// Track Dirty Harry story submissions (memory-only, resets on page reload)
let dirtyHarryLastStory = '';
let dirtyHarryAttemptCount = 0;

const Puzzles = {
    async showBenthamScales() {
        // Always show the puzzle, but conditionally show advisor content
        const hasAdvisor = GameState.isClueUnlocked('advisor');
        let advisorContentHTML = '';
        
        if (hasAdvisor) {
            // Load advisor content to show for reference
            const advisorContent = await ClueSystem.loadClueContent('advisor');
            const withoutFirstLine = advisorContent.split('\n').slice(1).join('\n');
            advisorContentHTML = `
                <div style="background: var(--bg-darker); border-left: 4px solid var(--text-amber); padding: 1rem; margin: 1rem 0;">
                    <h3 style="color: var(--text-amber); margin-top: 0;">Advisor Assessment</h3>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${UI.renderMarkdown(withoutFirstLine)}
                    </div>
                </div>
            `;
        }
        
        const html = `
            <div class="bentham-puzzle">
                <p class="bentham-intro">
                    Contact the advisor via secure transmission, then use these scales to quantify their assessment.
                </p>
                
                ${advisorContentHTML}
                
                <p style="margin-top: 1.5rem;"><strong>Rate the threat on each scale:</strong></p>
                
                ${this.renderBenthamScale('intensity')}
                ${this.renderBenthamScale('duration')}
                ${this.renderBenthamScale('certainty')}
                ${this.renderBenthamScale('nearness')}
                
                <button onclick="Puzzles.submitBenthamScales()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: var(--font-body); cursor: pointer;">
                    Submit Assessment
                </button>
                <p id="bentham-error" class="error-message" style="display:none;"></p>
            </div>
        `;
        
        UI.showPuzzle('bentham-scales', html);

        // Initialize visual highlights for default slider positions
        ['intensity', 'duration', 'certainty', 'nearness'].forEach(name => {
            const config = BenthamScaleConfig[name];
            if (config) {
                this.updateBenthamScaleVisual(name, config.defaultValue);
            }
        });
    },
    
    renderBenthamScale(name) {
        const config = BenthamScaleConfig[name];
        if (!config) return '';
        
        const sliderId = config.name;
        const labelsId = `${config.name}-labels`;
        
        const labelsHTML = config.levels.map(level => `
            <div class="bentham-scale-label" data-scale="${config.name}" data-value="${level.value}" title="${level.shortLabel}">
                <div class="bentham-scale-label-value">${level.value}</div>
                <div class="bentham-scale-label-text">${level.shortLabel}</div>
            </div>
        `).join('');
        
        return `
            <div class="scale-input bentham-scale-input">
                <label>${config.title}: ${config.prompt}</label>
                <input
                    type="range"
                    id="${sliderId}"
                    min="${config.min}"
                    max="${config.max}"
                    step="0.1"
                    value="${config.defaultValue}"
                    oninput="Puzzles.updateBenthamScaleVisual('${config.name}', this.value)"
                    onchange="Puzzles.snapBenthamSlider('${config.name}')"
                    onpointerup="Puzzles.snapBenthamSlider('${config.name}')"
                >
                <div class="bentham-scale-labels" id="${labelsId}">
                    ${labelsHTML}
                </div>
            </div>
        `;
    },
    
    updateBenthamScaleVisual(name, value) {
        const config = BenthamScaleConfig[name];
        if (!config) return;
        
        const numericValue = parseFloat(value);
        if (Number.isNaN(numericValue)) return;
        
        const clamped = Math.min(config.max, Math.max(config.min, Math.round(numericValue)));
        const labelsContainer = document.getElementById(`${name}-labels`);
        if (!labelsContainer) return;
        
        const labels = labelsContainer.querySelectorAll('.bentham-scale-label');
        labels.forEach(label => {
            const labelValue = parseInt(label.getAttribute('data-value'), 10);
            if (labelValue === clamped) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    },
    
    snapBenthamSlider(name) {
        const config = BenthamScaleConfig[name];
        if (!config) return;
        
        const slider = document.getElementById(name);
        if (!slider) return;
        
        const numericValue = parseFloat(slider.value);
        if (Number.isNaN(numericValue)) return;
        
        const clamped = Math.min(config.max, Math.max(config.min, Math.round(numericValue)));
        slider.value = clamped;
        this.updateBenthamScaleVisual(name, clamped);
    },
    
    async submitBenthamScales() {
        const getRoundedValue = (name) => {
            const config = BenthamScaleConfig[name];
            const slider = document.getElementById(name);
            if (!config || !slider) return null;
            const numericValue = parseFloat(slider.value);
            if (Number.isNaN(numericValue)) return null;
            return Math.min(config.max, Math.max(config.min, Math.round(numericValue)));
        };
        
        const answers = {
            intensity: getRoundedValue('intensity'),
            duration: getRoundedValue('duration'),
            certainty: getRoundedValue('certainty'),
            nearness: getRoundedValue('nearness')
        };
        
        const errorEl = document.getElementById('bentham-error');
        
        if (ClueSystem.validateBenthamScales(answers)) {
            // Correct! Unlock Bentham and show code
            GameState.unlockClue('bentham-scales');
            localStorage.setItem('benthamAnswers', JSON.stringify(answers));
            
            // Show success message with code
            const clue = ClueSystem.getClue('bentham-scales');
            const code = clue.key; // Code is '5345'
            const viewer = document.getElementById('clue-viewer');
            if (viewer) {
                viewer.innerHTML += `
                    <div style="background: var(--accent-green); border: 2px solid var(--text-amber); padding: 1rem; margin-top: 1rem;">
                        <p style="color: var(--text-primary); margin: 0;">
                            <strong>Assessment Complete!</strong> Your quantification matches the advisor's analysis.
                        </p>
                        <div style="background: var(--bg-darker); border: 2px solid var(--text-amber); padding: 1.5rem; margin-top: 1rem; text-align: center;">
                            <p style="color: var(--text-amber); font-size: 1.2rem; font-weight: bold; margin: 0 0 0.5rem 0;">Unlock Code:</p>
                            <p style="color: var(--text-primary); font-size: 2rem; font-family: var(--font-body); font-weight: bold; margin: 0; letter-spacing: 0.2rem;">${code}</p>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 1rem 0 0 0;">
                                Share this code with teammates who need to unlock the Steinhoff Definitions clue.
                            </p>
                        </div>
                    </div>
                `;
            }
            
            UI.updateClueCount();
            
            // Refresh discovery locations to show checkmark
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
        
        // Reset any previous matches
        window.steinhoffMatches = {};
        
        const html = `
            <div class="steinhoff-puzzle">
                <div class="matching-puzzle">
                    <div>
                        <h3>Definitions</h3>
                        <div id="definitions-list">
                            ${this.renderDefinitions(definitionsText)}
                        </div>
                    </div>
                    <div>
                        <h3>Examples</h3>
                        <div id="examples-list" ondragover="Puzzles.allowSteinhoffDrop(event)" ondrop="Puzzles.handleSteinhoffDropOnExamples(event)" ondragleave="Puzzles.handleSteinhoffDragLeave(event)">
                            ${this.renderExamples(examplesText)}
                        </div>
                    </div>
                </div>
                
                <button onclick="Puzzles.submitSteinhoffMatching()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: var(--font-body); cursor: pointer;">
                    Submit Matching
                </button>
                <p id="steinhoff-error" class="error-message" style="display:none;"></p>
            </div>
        `;
        
        UI.showPuzzle('steinhoff-definitions', html);
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
            <div
                class="match-item definition"
                data-def="${def.name}"
                onclick="Puzzles.handleSteinhoffDropZoneClick('${def.name}')"
            >
                <strong>${def.name}</strong>
                <p>${def.description}</p>
                <div
                    class="definition-drop-zone"
                    data-def="${def.name}"
                    data-placeholder="Drag an example here"
                    ondragover="Puzzles.allowSteinhoffDrop(event)"
                    ondrop="Puzzles.handleSteinhoffDropOnDefinition(event, '${def.name}')"
                    ondragleave="Puzzles.handleSteinhoffDragLeave(event)"
                    onclick="Puzzles.handleSteinhoffDropZoneClick('${def.name}')"
                ></div>
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
            <div
                class="match-item example"
                data-example="${ex.number}"
                draggable="true"
                ondragstart="Puzzles.handleSteinhoffDragStart(event, '${ex.number}')"
                ondragend="Puzzles.handleSteinhoffDragEnd(event)"
                onclick="Puzzles.handleSteinhoffExampleClick('${ex.number}')"
            >
                <strong>Example ${ex.number}</strong>
                <p>${ex.text}</p>
            </div>
        `).join('');
    },
    
    handleSteinhoffDragStart(event, exampleNum) {
        if (!event || !event.dataTransfer) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', exampleNum);
        
        const el = event.currentTarget || event.target;
        if (el && el.classList) {
            el.classList.add('dragging');
        }
    },
    
    handleSteinhoffDragEnd(event) {
        const el = event.currentTarget || event.target;
        if (el && el.classList) {
            el.classList.remove('dragging');
        }
    },
    
    allowSteinhoffDrop(event) {
        if (!event) return;
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        
        const dropZone = event.currentTarget;
        if (dropZone && dropZone.classList && dropZone.classList.contains('definition-drop-zone')) {
            dropZone.classList.add('drag-over');
        }
    },
    
    handleSteinhoffDragLeave(event) {
        const dropZone = event.currentTarget;
        if (dropZone && dropZone.classList) {
            dropZone.classList.remove('drag-over');
        }
    },
    
    handleSteinhoffDropOnDefinition(event, defName) {
        if (!event) return;
        event.preventDefault();
        
        const exampleNum = event.dataTransfer ? event.dataTransfer.getData('text/plain') : null;
        if (!exampleNum) return;
        
        const dropZone = event.currentTarget;
        if (!dropZone || !dropZone.classList) return;
        
        dropZone.classList.remove('drag-over');
        this.assignSteinhoffExampleToDefinition(exampleNum, defName, dropZone);
    },
    
    handleSteinhoffDropOnExamples(event) {
        if (!event) return;
        event.preventDefault();
        
        if (!window.steinhoffMatches) window.steinhoffMatches = {};
        
        const exampleNum = event.dataTransfer ? event.dataTransfer.getData('text/plain') : null;
        if (!exampleNum) return;
        
        const examplesList = document.getElementById('examples-list');
        if (!examplesList) return;
        
        const exampleEl = document.querySelector(`.match-item.example[data-example="${exampleNum}"]`);
        if (!exampleEl) return;
        
        examplesList.appendChild(exampleEl);
        
        // Remove from any definition mapping
        Object.keys(window.steinhoffMatches).forEach(def => {
            if (window.steinhoffMatches[def] === exampleNum) {
                delete window.steinhoffMatches[def];
                const dropZone = document.querySelector(`.definition-drop-zone[data-def="${def}"]`);
                if (dropZone && dropZone.classList) {
                    dropZone.classList.remove('has-example');
                }
            }
        });

        // Clear selection highlight if this example was selected
        if (window.steinhoffSelectedExample === exampleNum) {
            window.steinhoffSelectedExample = null;
        }
        const selectedEl = document.querySelector('.match-item.example.selected');
        if (selectedEl) {
            selectedEl.classList.remove('selected');
        }
    },

    handleSteinhoffExampleClick(exampleNum) {
        const exampleEl = document.querySelector(`.match-item.example[data-example="${exampleNum}"]`);
        if (!exampleEl) return;

        // Check if the clicked example is inside a definition drop zone
        const dropZone = exampleEl.closest('.definition-drop-zone');
        
        // If inside a definition and another example is selected (different from clicked one)
        if (dropZone && window.steinhoffSelectedExample && window.steinhoffSelectedExample !== exampleNum) {
            const defName = dropZone.getAttribute('data-def');
            if (defName) {
                // Assign the selected example to this definition
                // This will automatically return the clicked example to the examples list
                this.assignSteinhoffExampleToDefinition(window.steinhoffSelectedExample, defName, dropZone);
                return;
            }
        }

        // Normal selection behavior
        const allExamples = document.querySelectorAll('.match-item.example');
        allExamples.forEach(el => el.classList.remove('selected'));

        if (window.steinhoffSelectedExample === exampleNum) {
            window.steinhoffSelectedExample = null;
            return;
        }

        window.steinhoffSelectedExample = exampleNum;
        if (exampleEl) {
            exampleEl.classList.add('selected');
        }
    },

    handleSteinhoffDropZoneClick(defName) {
        const exampleNum = window.steinhoffSelectedExample;
        if (!exampleNum) return;
        this.assignSteinhoffExampleToDefinition(exampleNum, defName);
    },

    assignSteinhoffExampleToDefinition(exampleNum, defName, dropZone) {
        if (!window.steinhoffMatches) window.steinhoffMatches = {};

        if (!dropZone) {
            dropZone = document.querySelector(`.definition-drop-zone[data-def="${defName}"]`);
        }
        if (!dropZone) return;

        const exampleEl = document.querySelector(`.match-item.example[data-example="${exampleNum}"]`);
        if (!exampleEl) return;

        // Clear previous definition that used this example
        Object.keys(window.steinhoffMatches).forEach(def => {
            if (window.steinhoffMatches[def] === exampleNum && def !== defName) {
                delete window.steinhoffMatches[def];
                const prevDrop = document.querySelector(`.definition-drop-zone[data-def="${def}"]`);
                if (prevDrop && prevDrop.classList) {
                    prevDrop.classList.remove('has-example');
                }
            }
        });

        // If target already has an example, return it to the examples list
        const existingExample = dropZone.querySelector('.match-item.example');
        if (existingExample) {
            const examplesList = document.getElementById('examples-list');
            if (examplesList) {
                examplesList.appendChild(existingExample);
            }
        }

        // Append example to this definition
        dropZone.appendChild(exampleEl);
        dropZone.classList.add('has-example');

        window.steinhoffMatches[defName] = exampleNum;

        // Clear selection highlight
        window.steinhoffSelectedExample = null;
        const allExamples = document.querySelectorAll('.match-item.example');
        allExamples.forEach(el => el.classList.remove('selected'));
    },
    
    async submitSteinhoffMatching() {
        const matches = window.steinhoffMatches || {};
        const errorEl = document.getElementById('steinhoff-error');
        
        if (ClueSystem.validateSteinhoffMatching(matches)) {
            // Correct! Unlock steinhoff-definitions and show code
            GameState.unlockClue('steinhoff-definitions');
            localStorage.setItem('steinhoffMatches', JSON.stringify(matches));
            
            // Show success message with code
            const clue = ClueSystem.getClue('steinhoff-definitions');
            const code = clue.key; // Code is '7031'
            const viewer = document.getElementById('clue-viewer');
            if (viewer) {
                viewer.innerHTML += `
                    <div style="background: var(--accent-green); border: 2px solid var(--text-amber); padding: 1rem; margin-top: 1rem;">
                        <p style="color: var(--text-primary); margin: 0;">
                            <strong>Matching Complete!</strong> You have correctly matched Steinhoff's definitions to their examples.
                        </p>
                        <div style="background: var(--bg-darker); border: 2px solid var(--text-amber); padding: 1.5rem; margin-top: 1rem; text-align: center;">
                            <p style="color: var(--text-amber); font-size: 1.2rem; font-weight: bold; margin: 0 0 0.5rem 0;">Unlock Code:</p>
                            <p style="color: var(--text-primary); font-size: 2rem; font-family: var(--font-body); font-weight: bold; margin: 0; letter-spacing: 0.2rem;">${code}</p>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 1rem 0 0 0;">
                                Share this code with teammates who need to unlock the Historical Records clue.
                            </p>
                        </div>
                    </div>
                `;
            }
            UI.updateClueCount();
            
            // Refresh discovery locations to show checkmark
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
                <p>Read through the historical records below. For each record, classify the subject according to the three types from Shue's paper in the file cabinet:</p>
                <p>Count how many of each type to form the unlock code.</p>
                
                <div class="classification-puzzle">
                    ${this.renderRecords(recordsText)}
                </div>
                
                <button onclick="Puzzles.submitHistoricalRecords()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: var(--font-body); cursor: pointer;">
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
            <div class="record-item" data-record-index="${idx}">
                <p><strong>${record.header}</strong></p>
                <p>${record.text}</p>
                <div class="record-badges">
                    <button type="button" class="record-badge" data-value="RC" onclick="Puzzles.selectRecordClassification(${idx}, 'RC')">
                        RC – Ready Collaborator
                    </button>
                    <button type="button" class="record-badge" data-value="IB" onclick="Puzzles.selectRecordClassification(${idx}, 'IB')">
                        IB – Innocent Bystander
                    </button>
                    <button type="button" class="record-badge" data-value="DE" onclick="Puzzles.selectRecordClassification(${idx}, 'DE')">
                        DE – Dedicated Enemy
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    selectRecordClassification(index, classification) {
        if (!window.historicalRecords) window.historicalRecords = [];
        window.historicalRecords[index] = classification;
        
        const recordEl = document.querySelector(`.record-item[data-record-index="${index}"]`);
        if (recordEl) {
            const badges = recordEl.querySelectorAll('.record-badge');
            badges.forEach(badge => {
                const value = badge.getAttribute('data-value');
                if (value === classification) {
                    badge.classList.add('selected');
                } else {
                    badge.classList.remove('selected');
                }
            });
        }
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
            // Unlock historical-records and show code
            GameState.unlockClue('historical-records');
            localStorage.setItem('historicalRecords', JSON.stringify(classifications));
            
            // Show success message with code
            const clue = ClueSystem.getClue('historical-records');
            const code = clue.key; // Code is '212'
            const viewer = document.getElementById('clue-viewer');
            if (viewer) {
                const content = await ClueSystem.loadClueContent('historical-records');
                UI.showClue('historical-records', content);
                viewer.innerHTML += `
                    <div style="background: var(--accent-green); border: 2px solid var(--text-amber); padding: 1rem; margin-top: 1rem;">
                        <p style="color: var(--text-primary); margin: 0;">
                            <strong>Classification Complete!</strong> You have correctly classified all historical records according to Shue's definitions.
                        </p>
                        <div style="background: var(--bg-darker); border: 2px solid var(--text-amber); padding: 1.5rem; margin-top: 1rem; text-align: center;">
                            <p style="color: var(--text-amber); font-size: 1.2rem; font-weight: bold; margin: 0 0 0.5rem 0;">Unlock Code:</p>
                            <p style="color: var(--text-primary); font-size: 2rem; font-family: var(--font-body); font-weight: bold; margin: 0; letter-spacing: 0.2rem;">${code}</p>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 1rem 0 0 0;">
                                Share this code with teammates who need to unlock the Intervening Action clue.
                            </p>
                        </div>
                    </div>
                `;
            }
            UI.updateClueCount();
            
            // Refresh discovery locations to show checkmark
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
        
        // I thought this might be useful to you:

        // > The Principle of Intervening Action
        // > We are responsible for our actions, even if someone else caused us to act that way. We are not responsible for the consequences of actions taken by others because of us.
        
        // It is often misused, so you could check out some of what I hear get tossed around at the office. Decide which statements are supported by the principle of intervening action and those numbers should line up to form the password of a pamphlet I sent to the APA.

        const html = `
            <div class="intervening-action-puzzle">
                <h3>Email from Dr. Shannon Harp</h3>
                <p>I thought this might be useful to you:</p>

                <div class="clue-content">
                    <blockquote>
                        <strong>The Principle of Intervening Action:</strong><br>
                        We are responsible for our actions, even if someone else caused us to act that way. 
                        We are not responsible for the consequences of actions taken by others because of us.
                    </blockquote>
                </div>

                <p>It is often misused, so you could check out some of what I hear get tossed around at the office. Decide which statements are supported by the principle of intervening action and those numbers should line up to form the password of a pamphlet I sent to the APA.</p>
                
                <div class="statements-list">
                    ${this.renderStatements(interveningText)}
                </div>
                
                <button onclick="Puzzles.submitInterveningAction()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: var(--font-body); cursor: pointer;">
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
            // Unlock intervening-action and show code
            GameState.unlockClue('intervening-action');
            localStorage.setItem('interveningAction', JSON.stringify(selected));
            
            // Show success message with code
            const clue = ClueSystem.getClue('intervening-action');
            const code = clue.key; // Code is '87'
            const viewer = document.getElementById('clue-viewer');
            if (viewer) {
                viewer.innerHTML += `
                    <div style="background: var(--accent-green); border: 2px solid var(--text-amber); padding: 1rem; margin-top: 1rem;">
                        <p style="color: var(--text-primary); margin: 0;">
                            <strong>Analysis Complete!</strong> You have correctly identified which statements are supported by the principle of intervening action.
                        </p>
                        <div style="background: var(--bg-darker); border: 2px solid var(--text-amber); padding: 1.5rem; margin-top: 1rem; text-align: center;">
                            <p style="color: var(--text-amber); font-size: 1.2rem; font-weight: bold; margin: 0 0 0.5rem 0;">Unlock Code:</p>
                            <p style="color: var(--text-primary); font-size: 2rem; font-family: var(--font-body); font-weight: bold; margin: 0; letter-spacing: 0.2rem;">${code}</p>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 1rem 0 0 0;">
                                Share this code with teammates who need to unlock the AFF Pamphlet clue.
                            </p>
                        </div>
                    </div>
                `;
            }
            UI.updateClueCount();
            
            // Refresh discovery locations to show checkmark
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
                
                <textarea id="dirty-harry-story" rows="10" style="width: 100%; background: var(--bg-darker); border: 2px solid var(--border-color); color: var(--text-primary); padding: 1rem; font-family: var(--font-body); margin: 1rem 0;"></textarea>
                
                <button id="dirty-harry-submit-btn" onclick="Puzzles.submitDirtyHarry()" style="margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-green); border: none; color: var(--text-primary); font-family: var(--font-body); cursor: pointer;">
                    Submit Story
                </button>
                <p id="dirty-harry-error" class="error-message" style="display:none;"></p>
                <p id="dirty-harry-feedback" style="display:none; color: var(--text-amber); margin-top: 1rem;"></p>
                <div id="dirty-harry-bypass-container" style="display:none; margin-top: 1rem;">
                    <button onclick="Puzzles.acceptDirtyHarryAnyway()" style="padding: 0.75rem 2rem; background: var(--text-amber); border: none; color: var(--bg-darker); font-family: var(--font-body); cursor: pointer; font-weight: bold;">
                        Accept Story Anyway
                    </button>
                    <p style="color: var(--text-secondary); margin-top: 1rem;">
                        You've submitted multiple stories. If you believe your story meets the requirements, you can accept it anyway.
                    </p>
                </div>
            </div>
        `;
        
        UI.showPuzzle('dirty-harry', html);
        
        // Set up event listeners for textarea to update submit button state
        const textarea = document.getElementById('dirty-harry-story');
        const submitBtn = document.getElementById('dirty-harry-submit-btn');
        
        if (submitBtn) {
            // Initially disable button if LLM is still loading
            if (!window.dirtyHarryLLMEngine && window.webllm && typeof caches !== 'undefined') {
                // LLM is available but not loaded yet - disable and show loading
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.textContent = 'Loading...';
            } else {
                // LLM not available or already loaded - enable button
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
        }
        
        if (textarea && submitBtn) {
            const updateButton = () => Puzzles.updateDirtyHarrySubmitButton();
            textarea.addEventListener('input', updateButton);
            textarea.addEventListener('paste', () => setTimeout(updateButton, 0));
            
            // Initial button state check
            updateButton();
        }
    },
    
    updateDirtyHarrySubmitButton() {
        const textarea = document.getElementById('dirty-harry-story');
        const submitBtn = document.getElementById('dirty-harry-submit-btn');
        
        if (!textarea || !submitBtn) return;
        
        // If button text is "Submit Story", LLM has finished loading (or was never needed)
        // Skip loading check in that case
        const buttonText = submitBtn.textContent.trim();
        const isLLMFinishedLoading = buttonText === 'Submit Story' || window.dirtyHarryLLMEngine;
        
        // Check if LLM is still loading (button should remain disabled)
        // Only check if button text indicates loading AND LLM isn't finished
        if (!isLLMFinishedLoading) {
            const isLLMLoading = !window.dirtyHarryLLMEngine && window.webllm && typeof caches !== 'undefined';
            if (isLLMLoading && buttonText.includes('Loading')) {
                // Keep button disabled while loading
                return;
            }
        }
        
        // LLM is loaded or not available - proceed with normal button state logic
        const currentStory = textarea.value.trim();
        const isEmpty = currentStory === '';
        const matchesLastStory = currentStory === dirtyHarryLastStory;
        
        if (isEmpty || matchesLastStory) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        } else {
            // Enable button if there's text
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    },
    
    async submitDirtyHarry() {
        const story = document.getElementById('dirty-harry-story').value.trim();
        const errorEl = document.getElementById('dirty-harry-error');
        const feedbackEl = document.getElementById('dirty-harry-feedback');
        const bypassContainer = document.getElementById('dirty-harry-bypass-container');
        const submitBtn = document.getElementById('dirty-harry-submit-btn');
        
        if (!story) {
            if (errorEl) {
                errorEl.textContent = 'Please write a story.';
                errorEl.style.display = 'block';
            }
            return;
        }
        
        // Disable submit button during validation
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.textContent = 'Validating...';
        }
        
        try {
            // Validate story using LLM (async)
            const validationResult = await ClueSystem.validateDirtyHarryStory(story);
            
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
                submitBtn.textContent = 'Submit Story';
            }
            
            if (validationResult.valid) {
                // Correct! Unlock dirty-harry and show code for custom-form
                GameState.unlockClue('dirty-harry');
                localStorage.setItem('dirtyHarryStory', story);
                
                // Reset tracking on success
                dirtyHarryLastStory = '';
                dirtyHarryAttemptCount = 0;
                
                // Hide bypass button if it was shown
                if (bypassContainer) {
                    bypassContainer.style.display = 'none';
                }
                
                // Hide error and feedback
                if (errorEl) errorEl.style.display = 'none';
                if (feedbackEl) feedbackEl.style.display = 'none';
                
                // Show success message with code
                const clue = ClueSystem.getClue('custom-form');
                const code = clue.key; // Code is '0999'
                const viewer = document.getElementById('clue-viewer');
                if (viewer) {
                    viewer.innerHTML += `
                        <div style="background: var(--accent-green); border: 2px solid var(--text-amber); padding: 1rem; margin-top: 1rem;">
                            <p style="color: var(--text-primary); margin: 0;">
                                <strong>✓ Your Dirty Harry scenario has been accepted.</strong>
                            </p>
                            <div style="background: var(--bg-darker); border: 2px solid var(--text-amber); padding: 1.5rem; margin-top: 1rem; text-align: center;">
                                <p style="color: var(--text-amber); font-size: 1.2rem; font-weight: bold; margin: 0 0 0.5rem 0;">Unlock Code:</p>
                                <p style="color: var(--text-primary); font-size: 2rem; font-family: var(--font-body); font-weight: bold; margin: 0; letter-spacing: 0.2rem;">${code}</p>
                                <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 1rem 0 0 0;">
                                    This authorization code unlocks the Custom Authorization Form.
                                </p>
                            </div>
                        </div>
                    `;
                }
                
                UI.updateClueCount();
                
                // Refresh discovery locations to show checkmark
                if (typeof setupDiscoveryLocations === 'function') {
                    setupDiscoveryLocations();
                }
            } else {
                // Story failed validation - check if this is different from last story
                const isNewStory = story !== dirtyHarryLastStory;
                if (isNewStory) {
                    dirtyHarryLastStory = story;
                    dirtyHarryAttemptCount++;
                }
                
                // Provide feedback with attempt number using missing elements from validation
                const missing = validationResult.missing || [];
                
                if (feedbackEl) {
                    let attemptText;
                    if (dirtyHarryAttemptCount <= 5) {
                        attemptText = `Attempt ${dirtyHarryAttemptCount}/5`;
                    } else {
                        attemptText = `Attempt ${dirtyHarryAttemptCount}`;
                    }
                    if (missing.length > 0) {
                        feedbackEl.textContent = `${attemptText}: Your story is missing: ${missing.join(', ')}. Please revise and try again.`;
                    } else {
                        feedbackEl.textContent = `${attemptText}: Your story does not meet the requirements. Please revise and try again.`;
                    }
                    feedbackEl.style.display = 'block';
                }
                
                // Show bypass button if 5 or more failed attempts
                if (dirtyHarryAttemptCount >= 5 && bypassContainer) {
                    bypassContainer.style.display = 'block';
                }
                
                // Update submit button state
                this.updateDirtyHarrySubmitButton();
            }
        } catch (error) {
            console.error('Error during Dirty Harry validation:', error);
            
            // Re-enable submit button on error
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
                submitBtn.textContent = 'Submit Story';
            }
            
            // Show error message
            if (errorEl) {
                errorEl.textContent = 'An error occurred while validating your story. Please try again.';
                errorEl.style.display = 'block';
            }
        }
    },
    
    async acceptDirtyHarryAnyway() {
        const story = document.getElementById('dirty-harry-story').value.trim();
        
        if (!story) {
            const errorEl = document.getElementById('dirty-harry-error');
            if (errorEl) {
                errorEl.textContent = 'Please write a story.';
                errorEl.style.display = 'block';
            }
            return;
        }
        
        // Bypass validation and trigger success flow
        GameState.unlockClue('dirty-harry');
        localStorage.setItem('dirtyHarryStory', story);
        
        // Hide bypass button
        const bypassContainer = document.getElementById('dirty-harry-bypass-container');
        if (bypassContainer) {
            bypassContainer.style.display = 'none';
        }
        
        // Hide feedback
        const feedbackEl = document.getElementById('dirty-harry-feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
        }
        
        // Show success message with code
        const clue = ClueSystem.getClue('custom-form');
        const code = clue.key; // Code is '0999'
        const viewer = document.getElementById('clue-viewer');
        if (viewer) {
            viewer.innerHTML += `
                <div style="background: var(--accent-green); border: 2px solid var(--text-amber); padding: 1rem; margin-top: 1rem;">
                    <p style="color: var(--text-primary); margin: 0;">
                        <strong>✓ Your Dirty Harry scenario has been accepted.</strong>
                    </p>
                    <div style="background: var(--bg-darker); border: 2px solid var(--text-amber); padding: 1.5rem; margin-top: 1rem; text-align: center;">
                        <p style="color: var(--text-amber); font-size: 1.2rem; font-weight: bold; margin: 0 0 0.5rem 0;">Unlock Code:</p>
                        <p style="color: var(--text-primary); font-size: 2rem; font-family: var(--font-body); font-weight: bold; margin: 0; letter-spacing: 0.2rem;">${code}</p>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 1rem 0 0 0;">
                            This authorization code unlocks the Custom Authorization Form.
                        </p>
                    </div>
                </div>
            `;
        }
        
        UI.updateClueCount();
        
        // Refresh discovery locations to show checkmark
        if (typeof setupDiscoveryLocations === 'function') {
            setupDiscoveryLocations();
        }
    }
};
