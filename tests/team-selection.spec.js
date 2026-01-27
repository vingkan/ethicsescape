import { test, expect } from '@playwright/test';
import {
  navigateToTeamSelection,
  selectTeamSize,
  selectCodeName,
  startGame,
  getTeamData,
  getVisibleClues,
  checkClueAccess,
  configurePlayer,
  getExpectedClues,
} from './helpers/game-helpers.js';

// Server URLs - Playwright manages these via webServer config
const SERVER_URLS = {
  4000: 'http://localhost:4000',
  4001: 'http://localhost:4001',
  4002: 'http://localhost:4002',
  4003: 'http://localhost:4003',
};

function getServerUrl(port) {
  return SERVER_URLS[port];
}

test.describe('Team Selection Flow', () => {
  test('should allow selecting team size and code name', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const baseUrl = getServerUrl(4000);

    await navigateToTeamSelection(page, baseUrl);

    // Select team size
    await selectTeamSize(page, 2);
    
    // Verify code name selection appears
    await expect(page.locator('#code-name-selection')).toBeVisible();

    // Select code name (Heart - index 0)
    await selectCodeName(page, 0);

    // Verify localStorage contains correct team data
    const teamData = await getTeamData(page);
    expect(teamData.size).toBe(2);
    expect(teamData.members).toEqual(['Heart', 'Spade']);
    expect(teamData.currentPlayerIndex).toBe(0);

    await context.close();
  });

  test('should start game and redirect to game.html', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const baseUrl = getServerUrl(4000);

    await navigateToTeamSelection(page, baseUrl);
    await selectTeamSize(page, 1);
    await selectCodeName(page, 0);
    await startGame(page);

    // Verify we're on game.html
    expect(page.url()).toContain('game.html');

    await context.close();
  });
});

test.describe('Clue Distribution', () => {
  test('1 player - should see all clues', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const baseUrl = getServerUrl(4000);

    await configurePlayer(page, baseUrl, 1, 0);

    // Get expected clues for single player
    const expectedClues = getExpectedClues(0, 1);
    
    // Get visible clues
    const visibleClues = await getVisibleClues(page);

    // Verify all expected clues are visible
    // Note: Some clues like 'shue-post-it' and 'secure-pager-code' are post-it notes
    // and may not appear in the discovery grid, so we check for the main clues
    const mainClues = expectedClues.filter(clue => 
      !['shue-post-it', 'secure-pager-code', 'custom-form', 'truth'].includes(clue)
    );

    for (const clueId of mainClues) {
      const hasAccess = await checkClueAccess(page, clueId);
      expect(hasAccess).toBe(true);
    }

    // Verify always-available clues are present
    expect(visibleClues).toContain('briefing');
    expect(visibleClues).toContain('mdos-chart');

    await context.close();
  });

  test('2 players - should see correct clue distribution', async ({ browser }) => {
    const baseUrl1 = getServerUrl(4000);
    const baseUrl2 = getServerUrl(4001);

    // Configure player 1 (Heart, index 0)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await configurePlayer(page1, baseUrl1, 2, 0);

    // Configure player 2 (Spade, index 1)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await configurePlayer(page2, baseUrl2, 2, 1);

    // Get visible clues for each player
    const visibleClues1 = await getVisibleClues(page1);
    const visibleClues2 = await getVisibleClues(page2);

    // Player 1 should see: form-a, shue-post-it, shue-essay, bentham-scales, historical-records, pamphlet
    const player1SpecificClues = ['form-a', 'shue-essay', 'bentham-scales', 'historical-records', 'pamphlet'];
    for (const clueId of player1SpecificClues) {
      const hasAccess = await checkClueAccess(page1, clueId);
      expect(hasAccess).toBe(true);
    }

    // Player 1 should NOT see player 2's clues
    const player2SpecificClues = ['form-b', 'advisor', 'steinhoff-definitions', 'intervening-action', 'dirty-harry'];
    for (const clueId of player2SpecificClues) {
      const hasAccess = await checkClueAccess(page1, clueId);
      expect(hasAccess).toBe(false);
    }

    // Player 2 should see: form-b, secure-pager-code, advisor, steinhoff-definitions, intervening-action, dirty-harry
    for (const clueId of player2SpecificClues) {
      const hasAccess = await checkClueAccess(page2, clueId);
      expect(hasAccess).toBe(true);
    }

    // Player 2 should NOT see player 1's clues
    for (const clueId of player1SpecificClues) {
      const hasAccess = await checkClueAccess(page2, clueId);
      expect(hasAccess).toBe(false);
    }

    // Both should see always-available clues
    expect(visibleClues1).toContain('briefing');
    expect(visibleClues1).toContain('mdos-chart');
    expect(visibleClues2).toContain('briefing');
    expect(visibleClues2).toContain('mdos-chart');

    await context1.close();
    await context2.close();
  });

  test('3 players - should see correct clue distribution', async ({ browser }) => {
    const baseUrl1 = getServerUrl(4000);
    const baseUrl2 = getServerUrl(4001);
    const baseUrl3 = getServerUrl(4002);

    // Configure all three players
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await configurePlayer(page1, baseUrl1, 3, 0);

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await configurePlayer(page2, baseUrl2, 3, 1);

    const context3 = await browser.newContext();
    const page3 = await context3.newPage();
    await configurePlayer(page3, baseUrl3, 3, 2);

    // Player 1 (index 0): form-a, secure-pager-code, bentham-scales, intervening-action
    const player1Clues = ['form-a', 'bentham-scales', 'intervening-action'];
    for (const clueId of player1Clues) {
      expect(await checkClueAccess(page1, clueId)).toBe(true);
    }

    // Player 2 (index 1): form-b, shue-essay, steinhoff-definitions, pamphlet
    const player2Clues = ['form-b', 'shue-essay', 'steinhoff-definitions', 'pamphlet'];
    for (const clueId of player2Clues) {
      expect(await checkClueAccess(page2, clueId)).toBe(true);
    }

    // Player 3 (index 2): shue-post-it, advisor, historical-records, dirty-harry
    const player3Clues = ['advisor', 'historical-records', 'dirty-harry'];
    for (const clueId of player3Clues) {
      expect(await checkClueAccess(page3, clueId)).toBe(true);
    }

    // Verify each player doesn't see other players' clues
    expect(await checkClueAccess(page1, 'form-b')).toBe(false);
    expect(await checkClueAccess(page2, 'form-a')).toBe(false);
    expect(await checkClueAccess(page3, 'form-a')).toBe(false);

    // All should see always-available clues
    expect(await checkClueAccess(page1, 'briefing')).toBe(true);
    expect(await checkClueAccess(page2, 'briefing')).toBe(true);
    expect(await checkClueAccess(page3, 'briefing')).toBe(true);

    await context1.close();
    await context2.close();
    await context3.close();
  });

  test('4 players - should see correct clue distribution', async ({ browser }) => {
    const baseUrl1 = getServerUrl(4000);
    const baseUrl2 = getServerUrl(4001);
    const baseUrl3 = getServerUrl(4002);
    const baseUrl4 = getServerUrl(4003);

    // Configure all four players
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await configurePlayer(page1, baseUrl1, 4, 0);

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await configurePlayer(page2, baseUrl2, 4, 1);

    const context3 = await browser.newContext();
    const page3 = await context3.newPage();
    await configurePlayer(page3, baseUrl3, 4, 2);

    const context4 = await browser.newContext();
    const page4 = await context4.newPage();
    await configurePlayer(page4, baseUrl4, 4, 3);

    // Player 1 (index 0): form-a, shue-essay, historical-records
    const player1Clues = ['form-a', 'shue-essay', 'historical-records'];
    for (const clueId of player1Clues) {
      expect(await checkClueAccess(page1, clueId)).toBe(true);
    }

    // Player 2 (index 1): form-b, advisor, intervening-action
    const player2Clues = ['form-b', 'advisor', 'intervening-action'];
    for (const clueId of player2Clues) {
      expect(await checkClueAccess(page2, clueId)).toBe(true);
    }

    // Player 3 (index 2): shue-post-it, bentham-scales, pamphlet
    const player3Clues = ['bentham-scales', 'pamphlet'];
    for (const clueId of player3Clues) {
      expect(await checkClueAccess(page3, clueId)).toBe(true);
    }

    // Player 4 (index 3): secure-pager-code, steinhoff-definitions, dirty-harry
    const player4Clues = ['steinhoff-definitions', 'dirty-harry'];
    for (const clueId of player4Clues) {
      expect(await checkClueAccess(page4, clueId)).toBe(true);
    }

    // Verify each player doesn't see other players' clues
    expect(await checkClueAccess(page1, 'form-b')).toBe(false);
    expect(await checkClueAccess(page2, 'form-a')).toBe(false);
    expect(await checkClueAccess(page3, 'form-a')).toBe(false);
    expect(await checkClueAccess(page4, 'form-a')).toBe(false);

    // All should see always-available clues
    expect(await checkClueAccess(page1, 'briefing')).toBe(true);
    expect(await checkClueAccess(page2, 'briefing')).toBe(true);
    expect(await checkClueAccess(page3, 'briefing')).toBe(true);
    expect(await checkClueAccess(page4, 'briefing')).toBe(true);

    await context1.close();
    await context2.close();
    await context3.close();
    await context4.close();
  });
});
