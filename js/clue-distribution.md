# Clue Distribution

## Overview

- This game can be played by 1-4 players, each using their own device.
- The game is a fully static site, so there is no communication between the players' devices or instances of the game.
- On the starting screen, the players must enter their team members in the same order and indicate which player is themself, because the index of each player will determine which clues appear for them in the game.
- The game has many clues, some of which will end up being visible to all players, others of which will only appear for some.
- Players will have to share clues and the results of clues with each other to continue progressing, making the game more social.
- The game can still be played by one player who has all the clues.

## Clues

Here are the clues that are or eventually are available to all players:

briefing
mdos-chart
custom-form
truth (not really a clue, just the end of game reveal)

Here are the clues that act purely as tools to unlock or solve other clues. These will only be available to specific players:

form-a
form-b
shue-post-it (found on mdos-chart)
secure-pager-code (found on the main investigation screen)
shue-essay
advisor

Here are the clues that act as challenges that need to be solved to progress. These will only be available to specific players:

bentham-scales
steinhoff-definitions
historical-records
intervening-action
pamphlet
dirty-harry

I refer to the clues by their simple clue IDs from `/js/clues.js`. However, there are some caveats:

- I have lightly modified the IDs of some clues for readability: `bentham-scales` and `steinhoff-definitions`.
- The two post-it note based clues (`shue-post-it` and `secure-pager-code`) need to be added to `/js/clues.js`.
- Also, since those two are post-it note clues, they should still follow the post-it note form factor, not become tiles like other clues.
- The post-it notes should still appear in their current location, since both of them appear in locations that are available to any player.
- However, these post-it notes should now only be visible based on which player should have access to them.

## Distribution

Depending on the number of players, the twelve clues that are only available to specific players will be divided up differently. Players gain access to the clues that are available to them as they progress through the game.

### One Player

Player one will have:

form-a
form-b
shue-post-it
secure-pager-code
shue-essay
advisor
bentham-scales
steinhoff-definitions
historical-records
intervening-action
pamphlet
dirty-harry

### Two Players

Player one will have:

form-a
shue-post-it
shue-essay
bentham-scales
historical-records
pamphlet

Player two will have:

form-b
secure-pager-code
advisor
steinhoff-definitions
intervening-action
dirty-harry

### Three players

Player one will have:

form-a
secure-pager-code
bentham-scales
intervening-action

Player two will have:

form-b
shue-essay
steinhoff-definitions
pamphlet

Player three will have:

shue-post-it
advisor
historical-records
dirty-harry


### Four Players

Player one will have:

form-a
shue-essay
historical-records

Player two will have:

form-b
advisor
intervening-action

Player three will have:

shue-post-it
bentham-scales
pamphlet

Player four will have:

secure-pager-code
steinhoff-definitions
dirty-harry
