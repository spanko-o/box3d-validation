# Fine-Grained Object Events: Curated v2 Screening

This is a stricter screening layer built from `curated_v1`. It does not copy,
modify, or delete the source videos and NPZ files. It also does not approve
any sample for training.

## Tiers

- `event_core_candidate`: an object relation, unusual configuration, or
  visible multi-stage event makes the sentence useful for fine-grained text
  control. These still require human approval.
- `motion_supplement`: a reliable turn or start/stop motion, useful as a
  small auxiliary pool but not evidence of a high-information event.
- `event_candidate_needs_sentence_review`: the 3D track is visible, but the
  exact action or wording still needs a human check.
- `identity_hold`: the visible subject is not yet guaranteed to match the
  authoritative 3D track.

The authoritative primary track remains the existing evidence binding from
`curated_v1`. Qwen-Drive suggestions remain diagnostic only. A text-only
companion, such as the dog in `R023`, is intentionally not converted into a
guessed track.

## Current conservative core

The six strongest candidates for the first manual pass are `R023`, `R017`,
`R049`, `R007`, `R025`, and `R027`. The 3D timeline confirms that `R113` and
`R085` also have a visible primary target, but their final wording needs human
review. `R077` and `R078` are visible in the 3D timeline and are retained only
as low-priority turn supplements; an earlier model report saying “not visible”
was a model failure, not a reason to discard the track.

No `training_export` is produced at this stage. After manual review, an
explicit export should contain only records with `human_review_status` set to
approved and `training_approved` set to true.

Rebuild:

```bash
python Dataset/nuplan_object_events/curated_v2/code/build.py
```
