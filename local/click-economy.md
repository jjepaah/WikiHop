# Click Economy Balance Sheet

## Starting Values
- Initial Clicks: 18 (testing baseline)
- Base Reward: 10 clicks per stage

## Modifier Rewards
| Difficulty | Modifiers | Click Bonus | Total Reward |
|------------|-----------|-------------|--------------|
| None       | 0         | +0          | 10 clicks    |
| Easy       | 1         | +2          | 12 clicks    |
| Medium     | 2         | +5          | 15 clicks    |
| Hard       | 3         | +8          | 18 clicks    |

## Click Costs
- Standard Move: 1 click
- Shop Reroll: 4 clicks
- Modifier Reroll: 4 clicks
- Button Smasher Medium: 2 clicks/move
- Button Smasher Hard: 4 clicks/move

## Stage Projection (Balanced Path)
| Stage | Difficulty | Starting | Navigation Cost | Reward | Ending |
|-------|-----------|----------|-----------------|--------|--------|
| 1     | Broad     | 18       | -5             | 12     | 25     |
| 2     | Broad     | 25       | -6             | 15     | 34     |
| 3     | Broad     | 34       | -7             | 12     | 39     |
| 4     | Medium    | 39       | -8             | 15     | 46     |
| 5     | Medium    | 46       | -9             | 12     | 49     |
| 6     | Medium    | 49       | -10            | 15     | 54     |
| 7     | High      | 54       | -11            | 12     | 55     |
| 8     | High      | 55       | -12            | 15     | 58     |
| 9     | High      | 58       | -13            | 12     | 57     |
| 10    | High      | 57       | -14            | 15     | 58     |

Target: 7-10 stages average run length