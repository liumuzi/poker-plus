import { describe, it, expect } from 'vitest';
import { parseAction } from '../utils/formatting';

describe('parseAction', () => {
  it('parses Fold', () => {
    expect(parseAction('Fold')).toEqual(['弃牌']);
  });

  it('parses Check', () => {
    expect(parseAction('Check')).toEqual(['让牌']);
  });

  it('parses Call with amount', () => {
    const parts = parseAction('Call 50');
    expect(parts.join(' ')).toContain('跟注');
    expect(parts.join(' ')).toContain('50');
  });

  it('parses Bet with amount', () => {
    const parts = parseAction('Bet 75');
    expect(parts.join(' ')).toContain('下注');
    expect(parts.join(' ')).toContain('75');
  });

  it('parses Raise to amount', () => {
    const parts = parseAction('Raise to 150');
    expect(parts.join(' ')).toContain('加注');
    expect(parts.join(' ')).toContain('150');
  });

  it('parses All-in with amount', () => {
    const parts = parseAction('All-in 200');
    expect(parts.join(' ')).toContain('全下');
    expect(parts.join(' ')).toContain('200');
  });

  it('returns an array', () => {
    expect(Array.isArray(parseAction('Fold'))).toBe(true);
  });
});
