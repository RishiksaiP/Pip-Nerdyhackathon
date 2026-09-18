# Learning design and honest limits

Pip uses learning by teaching: a learner constructs, explains, detects a counterexample, repairs Pip’s idea, and transfers it. This is an implementation of established teachable-agent principles, not a claim to have invented them or proved efficacy.

## Evidence, not completion

| Evidence | What it can support | What it cannot establish alone |
|---|---|---|
| Correct construction | Procedural and early concept knowledge | An explanation of why |
| Conceptual explanation | Expressed understanding, including informal language | Exact truth or long-term recall |
| Misconception repair | Recognition of a counterexample | Independent transfer |
| New number line/notation | Use in another representation | Broad generalization from one task |
| New story context | A second transfer representation | Delayed retention |
| Delayed independent review | Retention evidence | Classroom-validated mastery |

Fresh dimensions begin at .35 (a product prior). Successful evidence moves its relevant dimensions toward 1 with gain .45, discounted by hints, attempts and confidence. Incorrect evidence moves toward .1 with gain .30. This numerical update is a transparent heuristic; it is not calibrated probability. Overall weights are procedure .15, concepts .25, correction .20, transfer .30, retention .10. Explanation is tracked separately and required as a gate.

Mastery requires overall ≥.82, concepts ≥.75, explanation ≥.70, correction ≥.70, transfer ≥.80, and two distinct independent transfer activities with no hints or wrong attempts. Repeated stage success is deduplicated within a run. More clicks do not replace explanation or transfer. Later repetitions strengthen evidence, but fixed items create a familiarity limitation.

The demo contains explicitly seeded historical events and still requires two live independent transfer tasks. Seeded history is excluded from the adult independence percentage and daily quests. It is demonstration data, never a real learner record.

## Adaptation

An explanation can select one of 18 authored misconception records across fractions, multiplication and place value. A missing concept prompts a focused question. Model output cannot invent a new probe or alter exact operands. The notebook shows the corrected idea before transfer. A mistaken transfer opens an alternate picture and lowers its evidence reliability.

The skill graph encodes prerequisites. Mission selection prioritizes due review, unresolved misconceptions and incomplete ready skills. Fraction equivalence becomes the next ready concept after the demo’s magnitude mastery. Twelve of fifteen graph nodes map to existing activities; some share a teaching loop. Remaining nodes are marked as future activities. The app does not claim full K–5 coverage.

## Return and retention

Successful mastery schedules review in one day. Successful delayed review then schedules three and seven days. Missed reviews do not lose rewards or break a punitive streak. Daily quests ask for explanation, repair and proof; they reward productive learning behavior. Dates are computed from the local session clock using UTC day boundaries.

## What still needs research

A broader independent item bank; learner testing across ages and language backgrounds; teacher review of misconceptions; calibration of thresholds; longitudinal retention; accessibility testing with assistive-technology users; parent consent and durable safeguards before a public child-facing launch. The current model fixtures and automated tests establish implementation behavior, not learning gains.
