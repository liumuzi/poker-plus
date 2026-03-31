import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PokerCardMini from '../components/PokerCardMini';

describe('PokerCardMini', () => {
  it('renders card back when no card is given', () => {
    const { container } = render(<PokerCardMini patternId="test-0" />);
    // card back uses red-700 background class
    expect(container.querySelector('.bg-red-700')).toBeTruthy();
  });

  it('renders rank and suit symbol for a face-up card', () => {
    const card = { rank: 'A', suit: 's' };
    const { container } = render(<PokerCardMini card={card} patternId="test-1" />);
    expect(container.textContent).toContain('A');
    expect(container.textContent).toContain('♠');
  });

  it('renders a red suit for hearts', () => {
    const card = { rank: 'K', suit: 'h' };
    const { container } = render(<PokerCardMini card={card} patternId="test-2" />);
    expect(container.textContent).toContain('K');
    expect(container.textContent).toContain('♥');
    // colorClass for hearts is text-red-500
    expect(container.innerHTML).toContain('text-red-500');
  });

  it('applies dim (low opacity) class when dim=true', () => {
    const { container } = render(<PokerCardMini patternId="test-3" dim />);
    expect(container.querySelector('.opacity-35')).toBeTruthy();
  });

  it('does not apply opacity-35 when dim is false', () => {
    const { container } = render(<PokerCardMini patternId="test-4" dim={false} />);
    expect(container.querySelector('.opacity-35')).toBeFalsy();
  });

  it('uses the supplied width for inline style', () => {
    const { container } = render(<PokerCardMini card={{ rank: '2', suit: 'c' }} width={72} patternId="test-5" />);
    const div = container.firstChild;
    expect(div.style.width).toBe('72px');
  });

  it('uses a unique SVG pattern id to avoid duplicates', () => {
    const { container } = render(<PokerCardMini patternId="unique-abc" />);
    expect(container.innerHTML).toContain('pkr-mini-cross-unique-abc');
  });
});
