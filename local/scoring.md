# Scoring Balance Sheet

## Per-Stage Scoring Formula
Stage Score = (100 + (Unused Clicks x 10)) x Difficulty multiplier

| Difficulty | Multiplier |
|-----------|------------|
| 0 mods    | ×1.0       |
| 1 mod     | ×1.5       |
| 2 mods    | ×2.0       |
| 3 mods    | ×3.0       |

## Run Total Score Formula
Total Score = Sum(All Stage Scores) + (Stages Completed x 50)

## Example Scoring

### Conservative Run (0-1 modifiers)
| Stage | Unused Clicks | Base | Multiplier | Stage Score | Running Total |
|-------|---------------|------|------------|-------------|---------------|
| 1     | 5             | 100  | ×1.0       | 150         | 200           |
| 2     | 8             | 100  | ×1.5       | 270         | 520           |
| 3     | 6             | 100  | ×1.0       | 160         | 830           |
| 5     | -             | -    | -          | -           | ~1,500        |
| 10    | -             | -    | -          | -           | ~3,500        |

### Balanced Run (1-2 modifiers)
| Stage | Unused Clicks | Base | Multiplier | Stage Score | Running Total |
|-------|---------------|------|------------|-------------|---------------|
| 1     | 5             | 100  | ×1.5       | 225         | 275           |
| 2     | 10            | 100  | ×2.0       | 400         | 725           |
| 3     | 8             | 100  | ×1.5       | 270         | 1,145         |
| 5     | -             | -    | -          | -           | ~2,500        |
| 10    | -             | -    | -          | -           | ~6,000        |

### Aggressive Run (2-3 modifiers)
| Stage | Unused Clicks | Base | Multiplier | Stage Score | Running Total |
|-------|---------------|------|------------|-------------|---------------|
| 1     | 8             | 100  | ×2.0       | 360         | 410           |
| 2     | 12            | 100  | ×3.0       | 660         | 1,170         |
| 3     | 10            | 100  | ×2.0       | 600         | 1,920         |
| 5     | -             | -    | -          | -           | ~4,500        |
| 10    | -             | -    | -          | -           | ~12,000       |

## WikiPoints Earning
WikiPoints per Stage = 1 x Difficulty Multiplier

| Difficulty | WikiPoints Earned |
|-----------|-------------------|
| 0 mods    | 1                 |
| 1 mod     | 1-2 (1.5 rounded) |
| 2 mods    | 2                 |
| 3 mods    | 3                 |

Target: 10-stage run = 15-25 WikiPoints

## Score Milestones
- 1,000: Decent run
- 3,000: Good run
- 5,000: Great run
- 10,000: Excellent run
- 20,000+: Legendary run