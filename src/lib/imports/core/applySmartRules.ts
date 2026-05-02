/**
 * Deterministic rule engine for SmartTransform. Given a raw cell value and a
 * transform produced by smartMapColumns(), evaluates the rules in order and
 * returns the destField → coerced-value map produced by the first matching
 * rule. The caller (entity transformRow / buildDestFromMappings) is
 * responsible for merging the result into its dest accumulator.
 *
 * No IO, no Anthropic — pure function so it can be unit-tested in isolation.
 */

import { parseNumber, parseInteger, parseBool } from './transforms';
import type {
  SmartCondition,
  SmartAssignment,
  SmartTransform,
  ValueParser,
} from '../entities/types';

export function applySmartRules(
  rawValue: string | undefined,
  transform: SmartTransform,
): Record<string, unknown> {
  const cell = rawValue ?? '';
  for (const rule of transform.rules) {
    if (matchesCondition(cell, rule.condition)) {
      return runAssignments(cell, rule.assignments);
    }
  }
  return {};
}

function matchesCondition(cell: string, c: SmartCondition): boolean {
  switch (c.matchType) {
    case 'numeric':
      return parseNumber(cell) != null;
    case 'nonNumeric':
      return cell.trim() !== '' && parseNumber(cell) == null;
    case 'empty':
      return cell.trim() === '';
    case 'nonEmpty':
      return cell.trim() !== '';
    case 'equalsAny': {
      const norm = cell.trim().toLowerCase();
      return (c.values ?? []).some((v) => v.trim().toLowerCase() === norm);
    }
    case 'containsAny': {
      const norm = cell.toLowerCase();
      return (c.values ?? []).some((v) => norm.includes(v.toLowerCase()));
    }
    case 'regex': {
      if (!c.pattern) return false;
      try {
        return new RegExp(c.pattern, c.flags ?? '').test(cell);
      } catch {
        return false;
      }
    }
    case 'always':
      return true;
    default:
      return false;
  }
}

function runAssignments(cell: string, assignments: SmartAssignment[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const a of assignments) {
    if (Object.prototype.hasOwnProperty.call(a, 'literal')) {
      out[a.destField] = a.literal as unknown;
    } else {
      out[a.destField] = coerce(cell, a.parser);
    }
  }
  return out;
}

function coerce(cell: string, parser: ValueParser): unknown {
  switch (parser) {
    case 'string': {
      const t = cell.trim();
      return t === '' ? null : t;
    }
    case 'number':
      return parseNumber(cell);
    case 'integer':
      return parseInteger(cell);
    case 'boolean':
      return parseBool(cell);
    case 'raw':
      return cell;
    default:
      return cell;
  }
}
