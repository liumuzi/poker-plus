import { describe, it, expect } from 'vitest';
import { checkContent, checkPost } from '../utils/contentFilter';

// ─────────────────────────────────────────────────────────────
// contentFilter.js tests
// ─────────────────────────────────────────────────────────────

describe('checkContent', () => {
  it('should pass clean poker content', () => {
    const result = checkContent('AKo 在 BTN 位置开池，面对 CO 的 3bet');
    expect(result.isClean).toBe(true);
    expect(result.blockedWords).toEqual([]);
    expect(result.message).toBeNull();
  });

  it('should block gambling recruitment keywords', () => {
    const result = checkContent('私局约起来，加我微信');
    expect(result.isClean).toBe(false);
    expect(result.blockedWords.length).toBeGreaterThan(0);
    expect(result.message).toBeTruthy();
  });

  it('should block financial inducement keywords', () => {
    const result = checkContent('注册就送，稳赢不赔');
    expect(result.isClean).toBe(false);
  });

  it('should allow whitelisted poker terms', () => {
    const result = checkContent('这手现金局复盘，翻牌打了 equity');
    expect(result.isClean).toBe(true);
  });

  it('should handle null/undefined input', () => {
    expect(checkContent(null).isClean).toBe(true);
    expect(checkContent(undefined).isClean).toBe(true);
    expect(checkContent('').isClean).toBe(true);
  });

  it('should be case-insensitive for blocked keywords', () => {
    const result = checkContent('加我 TELEGRAM 群');
    expect(result.isClean).toBe(false);
  });
});

describe('checkPost', () => {
  it('should check both title and body', () => {
    const result = checkPost({
      title: '正常标题',
      body: '加我微信私聊',
    });
    expect(result.isClean).toBe(false);
  });

  it('should pass when both title and body are clean', () => {
    const result = checkPost({
      title: 'AKo 3bet 策略讨论',
      body: '面对 CO 开池，BTN 应该 3bet 还是跟注？',
    });
    expect(result.isClean).toBe(true);
  });

  it('should fail if title contains blocked keywords', () => {
    const result = checkPost({
      title: '私局招人',
      body: '正常的讨论内容',
    });
    expect(result.isClean).toBe(false);
  });
});
