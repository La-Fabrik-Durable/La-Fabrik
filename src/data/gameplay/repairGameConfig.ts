export const REPAIR_FRAGMENTATION_FIST_HOLD_SECONDS = 1;
export const REPAIR_FRAGMENTATION_SEQUENCE_SECONDS = 4;
export const REPAIR_INTERACTION_RADIUS = 10;
export const REPAIR_SCAN_PART_SECONDS = 1.2;
export const REPAIR_REASSEMBLY_SECONDS = 1.4;
/**
 * Lerp speed used by the shared ExplodableModel during the repair flow.
 * Lower = slower, more deliberate explosion so the player can see each
 * node clearly leave its original position. The default ExplodedModel
 * speed (6) finishes in ~0.5s which feels rushed.
 */
export const REPAIR_FRAGMENT_SPLIT_SPEED = 1.8;
/**
 * Delay between the end of the inverse-explosion (parts settled back to
 * their original positions) and the auto-transition to the `done` step.
 * Used by the ebike repair flow so the reassembly particles can play
 * before the bubble starts shrinking.
 */
export const REPAIR_REASSEMBLY_HOLD_MS = 1500;
/**
 * Fallback timer for the ebike `done` -> mission-complete transition
 * when the narrator audio fails to fire its `ended` event.
 */
export const REPAIR_DONE_DIALOGUE_FALLBACK_MS = 6000;
