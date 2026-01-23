
# Rogue Gamemode

## Overview
Brief description of the Rogue gamemode and its core concept.

## Core Mechanics

### Time Limits
- Round duration
- Turn timers (if applicable)

### Scoring System
Per Stage Score:
    - 100 base points
    - + (Unused clicks x 10)
    - x Difficulty multiplier
Run total score = Sum of total Stage score + (Stages completed x 50)

## Gameplay Flow

### Pre-stage
1. View current start click balance
    - 15-20 clicks
2. Random start location
2. See next target and estimated difficulty
3. Choose 1-3 modifiers from 3 random options (or pay clicks to reroll)
    - Choose 1 from 3 random modifiers.
        - Loop as many times as difficulty is set to

### Mid-stage
1. Navigate to target with active modifiers
2. Click counter decreases with each move
3. Modifiers create unique challenges

### End-stage
1. Award clicks based on: base reward + modifier bonuses + multiplier from something?
2. +8-10 clicks

### Shop-phase
1. Offer 3 random mid tier perks
2. Offer 1 more expensive special ability?
3. Reroll shop for cost
4. Shows your current click balance
5. You can buy multiple items

### Failure
1. Final score calculated
2. Unlock progress saved
3. When clicks reach 0
4. No retrys, run ends

### Sidebar
- Click balance
- Current stage number
- Total score
- Target
- Active modifiers
- Active items and perks
- WikiPoints earned in parenthesis after score "Total score: 240(3)"

### Difficulty
0. 0 modifier: +0 clicks, x1 score
1. 1 modifier: +2 clicks, x1.5 score
2. 2 modifiers: +5 clicks, x2.0 score
3. 3 modifiers: +8 clicks, x3.0 score

Stages:
    - 1-3: Broad topics
        - Countries
        - Animals
        - Sports
    - 4-6: Medium specificity
        - Cities
        - Specific sports
        - Historical events
    - 7-10: High specificity
        - Specific people
        - Technical terms
        - Niche topics
    - 11+: Very specific
        - Obscure historical figures
        - Specialized science terms

### Stage modifiers
Modifier difficulty adds to +clicks on stage completion.
Easy: +2, Medium: +4, Hard: +6
- Fog of War (Different difficulty versions)
    - Can only see X links at a time
        - Easy: 10 links
        - Medium: 6 links
        - Hard: 3 links
- Time Pressure (Different difficulty versions)
    - X sec per stage
        - Easy: 60 seconds
        - Medium: 50 seconds
        - Hard: 35 seconds
- Restricted Path
    - Certain categories blocked
        - Easy
- Detour
    - Must visit a specific article type first
        - Hard
- Don't look back:
    - Can't visit already visited links
        - Medium
- Button smasher:
    - Every click consumes X clicks
        - Medium: 2 clicks
        - Hard: 4 clicks
- Scenic route:
    - Path must be at least X clicks
        - Easy: 8 clicks
        - Medium: 14 clicks

### Power-ups/Items
- 2 free shop rerolls in next shop 
- Disable random modifier from current stage
- Skip target
    - Generate new target
- Efficient Navigator: Gain +2 clicks for every target reached
- Second Chance: One-time revival when you run out of clicks (restore 10 clicks)
- Master of Puppets: Every modifier give +2 extra clicks
- Speed Reader: Time-based modifiers give +15 seconds
- Reading glasses: Always see at least 5 links

### Events
Random events that may appear after opening article.
Max 1 event per article.
- Portal
    - Jump to a random article in target's category
- Wildcard
    - Choose a new target from 3 randomly generated targets

### Unlockables - WikiPoints
- WikiPoints awarded per stage completed
    - 1 per stage
    - Difficulty modifier applies to this also
    - Rarely can be found in articles
        - Golden color link
            - Have to click it and move to that article to be awarded
- Starting categories:
    - Unlocked by completing hidden achievements (no cost)
        - After unlock can see the effects but have to be bought to activate
    - Bought / activated with WikiPoints

## Roadmap

### Phase 1
- [] Basic click economy and stage progression
- [] 3-4 simple to implement modifiers
- [] Simple shop with some items (Costs can all be 1 click for start. Balance later)
- [] Basic scoring and failure states
- [] For start Targets can be from specific pools.
    - Countries
    - Foods
    - Religions
    - etc.
    - Later can be implemented random generation that has algorithm that determines the difficulty or category automatically

### Phase 2
- [] Full modifier set
- [] Complete shop system
- [] Meta-progression unlocks
- [] Leaderboard integration (x2)
    - Sorted by stages
    - Sorted by score
- [] Save/resume run

### Phase 3 (Polish)
- [] Special events/encounters (Event occurance rates balanced after implementation.)
- [] Daily challenge seeds
- [] Achievements (extra)
- [] Animations
- [] Run statistics and history (Can be added as soon as possible but doesn't need to be visual just for future reference start collect data to user)