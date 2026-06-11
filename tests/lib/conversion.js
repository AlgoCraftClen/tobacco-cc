/**
 * CC Tobacco Distribution OS — Inventory Conversion Engine
 *
 * CANONICAL UNIT LADDER (confirmed 2026-06-11):
 *   1 Case = 4 Boxes
 *   1 Box  = 19 Rolls
 *   1 Roll = 5 Cans
 *   ∴ 1 Case = 380 Cans  |  1 Box = 95 Cans
 */

/** Cans contained in one unit of each type. */
export const UNIT_LADDER_CANS = Object.freeze({
  Case: 380, // 4 boxes × 19 rolls × 5 cans
  Box:   95, // 19 rolls × 5 cans
  Roll:   5, // 5 cans
  Can:    1,
});

/** How many of each unit fit inside one Case. */
export const UNITS_PER_CASE = Object.freeze({
  Case:   1,
  Box:    4,
  Roll:  76, // 4 boxes × 19 rolls
  Can:  380, // 4 × 19 × 5
});

const VALID_UNITS = new Set(Object.keys(UNIT_LADDER_CANS));

function assertUnit(unit) {
  if (!VALID_UNITS.has(unit)) throw new Error(`Unknown unit: "${unit}"`);
}

/**
 * Convert a display quantity in a given unit to an integer can count.
 * Fractional results are floored (you cannot have 0.5 of a can).
 */
export function toCans(qty, unit) {
  assertUnit(unit);
  if (qty < 0) throw new RangeError(`Quantity cannot be negative (got ${qty})`);
  return Math.floor(qty * UNIT_LADDER_CANS[unit]);
}

/**
 * Convert an integer can count to a display quantity in the given unit.
 * The result may be fractional (e.g. 75 cans → 1.5 boxes).
 */
export function fromCans(cans, unit) {
  assertUnit(unit);
  if (cans < 0) throw new RangeError(`Can count cannot be negative (got ${cans})`);
  return cans / UNIT_LADDER_CANS[unit];
}

/**
 * Derive the unit price in cents from the case price in cents.
 * All results are rounded to the nearest cent.
 *
 * Example — casePriceCents = 380_000 ($3,800.00):
 *   Case → 380_000  ($3,800.00)
 *   Box  →  95_000  ($950.00)   [380_000 / 4]
 *   Roll →   5_000  ($50.00)    [380_000 / 76]
 *   Can  →   1_000  ($10.00)    [380_000 / 380]
 */
export function derivePriceCents(casePriceCents, unit) {
  assertUnit(unit);
  return Math.round(casePriceCents / UNITS_PER_CASE[unit]);
}

/**
 * Compute a line total in cents from a display quantity and unit price in cents.
 * Uses Math.round to avoid floating-point accumulation across many lines.
 */
export function computeLineTotal(unitQty, unitPriceCents) {
  return Math.round(unitQty * unitPriceCents);
}

/**
 * Estimate days of stock remaining.
 * @param {number} onHandCans  - current on-hand in cans (integer)
 * @param {number} sold30Cans  - cans sold in the past 30 days (integer)
 * @returns {number} estimated days remaining, or Infinity if velocity is zero
 */
export function daysOfStock(onHandCans, sold30Cans) {
  if (sold30Cans <= 0) return Infinity;
  return Math.round((onHandCans / sold30Cans) * 30);
}

/** Return the whole number of cases contained in a can count (floor). */
export function cansToFullCases(cans) {
  return Math.floor(cans / UNIT_LADDER_CANS.Case);
}

/**
 * Classify inventory status against configured thresholds.
 * onHandCans  - current on-hand in cans
 * reorderCases - reorder trigger in cases
 */
export function stockStatus(onHandCans, reorderCases) {
  const onHandCases = onHandCans / UNIT_LADDER_CANS.Case;
  if (onHandCases <= reorderCases * 0.5) return 'critical';
  if (onHandCases <= reorderCases) return 'low';
  return 'ok';
}
