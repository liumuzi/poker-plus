/**
 * 处理牌选择相关的 action（Hero底牌、选牌弹窗、公共牌预设、亮牌补录）
 */

export function handleSetHeroCard(state, action) {
  const newHeroCards = [...state.heroCards];
  newHeroCards[action.payload.position] = action.payload.card;
  return { ...state, heroCards: newHeroCards, pickingCardsTarget: null };
}

export function handleSetPickingTarget(state, action) {
  return {
    ...state,
    pickingCardsTarget: action.payload.target,
    tempCards: action.payload.target ? [] : state.tempCards,
  };
}

export function handleSelectTempCard(state, action) {
  const newTemp = [...state.tempCards, action.payload.card];
  return { ...state, tempCards: newTemp };
}

export function handleSetSetupCommunityCard(state, action) {
  const { index, card } = action.payload;
  const newPresetCards = [...(state.presetCommunityCards || [])];
  // 确保数组足够长
  while (newPresetCards.length <= index) {
    newPresetCards.push(null);
  }
  newPresetCards[index] = card;
  return {
    ...state,
    presetCommunityCards: newPresetCards,
    pickingCardsTarget: null,
  };
}

export function handleClearSetupCommunityCards(state) {
  return { ...state, presetCommunityCards: [] };
}

export function handleRevealPlayerCard(state, action) {
  const p = JSON.parse(JSON.stringify(state.players));
  const { playerIdx, cardPos, card } = action.payload;
  p[playerIdx].knownCards[cardPos] = card;
  return { ...state, players: p, pickingCardsTarget: null };
}
