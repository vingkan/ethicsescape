/**
 * Helper functions for interacting with the game in tests
 */

/**
 * Select team size from radio tiles
 */
export async function selectTeamSize(page, size) {
  const radioId = `team-size-${size}`;
  await page.check(`#${radioId}`);
  // Wait for code name selection to appear
  await page.waitForSelector('#code-name-selection', { state: 'visible' });
}

/**
 * Select code name by index (0 = Heart, 1 = Spade, 2 = Diamond, 3 = Club)
 */
export async function selectCodeName(page, index) {
  const radioId = `code-name-${index}`;
  await page.check(`#${radioId}`);
  // Wait a bit for the selection to be saved
  await page.waitForTimeout(100);
}

/**
 * Start the game by clicking the start button
 */
export async function startGame(page) {
  await page.click('#start-game-btn');
  // Wait for navigation to game.html
  await page.waitForURL('**/game.html', { timeout: 10000 });
}

/**
 * Get visible clue IDs from the discovery grid
 */
export async function getVisibleClues(page) {
  const discoveryItems = await page.locator('.discovery-item').all();
  const clueIds = [];

  for (const item of discoveryItems) {
    const id = await item.getAttribute('id');
    if (id) {
      // Extract clue ID from discovery-{location-id}
      const locationId = id.replace('discovery-', '');
      const clueId = mapLocationIdToClueId(locationId);
      if (clueId) {
        clueIds.push(clueId);
      }
    }
  }

  return clueIds;
}

/**
 * Map discovery location IDs to clue IDs
 * Based on discoveryLocations array in game-init.js
 */
function mapLocationIdToClueId(locationId) {
  const mapping = {
    'briefing': 'briefing',
    'mdos-chart': 'mdos-chart',
    'file-cabinet-shue': 'shue-essay',
    'secure-pager': 'advisor',
    'bentham-worksheet': 'bentham-scales',
    'manila-folder-a': 'form-a',
    'briefcase-b': 'form-b',
    'steinhoff-folder': 'steinhoff-definitions',
    'records-file': 'historical-records',
    'intervening-doc': 'intervening-action',
    'pamphlet-doc': 'pamphlet',
    'dirty-harry-trigger': 'dirty-harry',
  };
  return mapping[locationId];
}

/**
 * Check if a clue is visible/accessible to the player
 * This checks if the discovery item for the clue exists in the discovery grid
 */
export async function checkClueAccess(page, clueId) {
  // Map clue ID to location ID
  const locationId = mapClueIdToLocationId(clueId);
  if (!locationId) {
    // Some clues like 'shue-post-it' and 'secure-pager-code' are post-it notes
    // and don't appear in the discovery grid, so we can't check them this way
    return false;
  }

  const discoveryItem = page.locator(`#discovery-${locationId}`);
  const isVisible = await discoveryItem.isVisible().catch(() => false);
  return isVisible;
}

/**
 * Map clue ID to location ID (reverse of mapLocationIdToClueId)
 */
function mapClueIdToLocationId(clueId) {
  const mapping = {
    'briefing': 'briefing',
    'mdos-chart': 'mdos-chart',
    'shue-essay': 'file-cabinet-shue',
    'advisor': 'secure-pager',
    'bentham-scales': 'bentham-worksheet',
    'form-a': 'manila-folder-a',
    'form-b': 'briefcase-b',
    'steinhoff-definitions': 'steinhoff-folder',
    'historical-records': 'records-file',
    'intervening-action': 'intervening-doc',
    'pamphlet': 'pamphlet-doc',
    'dirty-harry': 'dirty-harry-trigger',
  };
  return mapping[clueId];
}

/**
 * Get localStorage value
 */
export async function getLocalStorage(page, key) {
  return await page.evaluate((k) => {
    return localStorage.getItem(k);
  }, key);
}

/**
 * Get team data from localStorage
 */
export async function getTeamData(page) {
  const teamMembers = await getLocalStorage(page, 'teamMembers');
  const teamSize = await getLocalStorage(page, 'teamSize');
  const currentPlayerIndex = await getLocalStorage(page, 'currentPlayerIndex');

  return {
    members: teamMembers ? JSON.parse(teamMembers) : [],
    size: teamSize ? parseInt(teamSize) : 0,
    currentPlayerIndex: currentPlayerIndex !== null ? parseInt(currentPlayerIndex) : 0,
  };
}

/**
 * Navigate to team selection page
 */
export async function navigateToTeamSelection(page, baseUrl) {
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
  // Wait for team size tiles container to be present instead of dropdown
  await page.waitForSelector('#team-size-tiles', { timeout: 10000 });
}

/**
 * Configure a player with team size and code name index
 */
export async function configurePlayer(page, baseUrl, teamSize, playerIndex) {
  await navigateToTeamSelection(page, baseUrl);
  await selectTeamSize(page, teamSize);
  await selectCodeName(page, playerIndex);
  await startGame(page);
}

/**
 * Check if form selection is accessible (for first player)
 */
export async function checkFormSelectionAccess(page) {
  // Try to click the submit button if it exists
  const submitButton = page.locator('#submit-form-btn');
  const isVisible = await submitButton.isVisible().catch(() => false);
  
  if (!isVisible) {
    return { accessible: false, reason: 'Submit button not visible' };
  }

  // Click the button
  await submitButton.click();
  
  // Wait for form selection view or access restricted message
  await page.waitForTimeout(1000);
  
  const formSelectionView = page.locator('#form-selection-view');
  const isFormSelectionVisible = await formSelectionView.isVisible().catch(() => false);
  
  if (isFormSelectionVisible) {
    // Check for access restricted message
    const restrictedMessage = await formSelectionView.locator('text=Access Restricted').isVisible().catch(() => false);
    if (restrictedMessage) {
      return { accessible: false, reason: 'Access restricted message shown' };
    }
    return { accessible: true };
  }

  return { accessible: false, reason: 'Form selection view not shown' };
}

/**
 * Get expected clues for a player based on team size and player index
 */
export function getExpectedClues(playerIndex, teamSize) {
  // Always available clues
  const alwaysAvailable = ['briefing', 'mdos-chart', 'custom-form', 'truth'];
  
  // Player-specific clues based on distribution tables
  let playerClues = [];
  
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
  }
  
  return [...alwaysAvailable, ...playerClues];
}

/**
 * Get expected clue count for a player (excluding 'truth' which is not counted)
 */
export function getExpectedClueCount(playerIndex, teamSize) {
  const ALWAYS_AVAILABLE_CLUES = new Set(['briefing', 'mdos-chart', 'custom-form', 'truth']);
  const expectedClues = getExpectedClues(playerIndex, teamSize);
  // Exclude always-available clues from count
  return expectedClues.filter(clueId => !ALWAYS_AVAILABLE_CLUES.has(clueId)).length;
}

/**
 * Get the clue count displayed in the header
 * Returns an object with { unlocked, total } parsed from "X / Y" format
 */
export async function getClueCount(page) {
  const clueCountText = await page.locator('#clue-count').textContent();
  const match = clueCountText.match(/(\d+)\s*\/\s*(\d+)/);
  if (match) {
    return {
      unlocked: parseInt(match[1]),
      total: parseInt(match[2])
    };
  }
  return null;
}
