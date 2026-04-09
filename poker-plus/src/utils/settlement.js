// src/utils/settlement.js
// Pure calculation functions — no side effects

/** 单筹码价值 */
export const getChipValue = (moneyPerHand, chipsPerHand) => {
  if (!chipsPerHand || chipsPerHand === 0) return 0;
  return moneyPerHand / chipsPerHand;
};

/** 计算单个玩家结算数据 */
export const calcPlayer = (player, chipsPerHand, moneyPerHand) => {
  const chipValue = getChipValue(moneyPerHand, chipsPerHand);
  const hands = Number(player.handsBought) || 0;
  const cashout = Number(player.cashoutChips) || 0;
  const buyInChips = hands * chipsPerHand;
  const buyInMoney = hands * moneyPerHand;
  const cashoutMoney = cashout * chipValue;
  const profit = cashoutMoney - buyInMoney;
  return { ...player, buyInChips, buyInMoney, cashoutChips: cashout, cashoutMoney, profit };
};

/** 计算全局汇总 */
export const calcSummary = (players) => {
  const totalBuyInChips = players.reduce((s, p) => s + (p.buyInChips || 0), 0);
  const totalCashoutChips = players.reduce((s, p) => s + (p.cashoutChips || 0), 0);
  const chipsGap = totalCashoutChips - totalBuyInChips;
  const isBalanced = Math.abs(chipsGap) <= 1;
  const totalBuyInMoney = players.reduce((s, p) => s + (p.buyInMoney || 0), 0);
  const totalCashoutMoney = players.reduce((s, p) => s + (p.cashoutMoney || 0), 0);
  return { totalBuyInChips, totalCashoutChips, chipsGap, isBalanced, totalBuyInMoney, totalCashoutMoney };
};

/** 最少转账次数贪心算法 */
export const calcTransfers = (players) => {
  const debtors = players
    .filter((p) => p.profit < -0.01)
    .map((p) => ({ name: p.name, amount: -p.profit }));
  const creditors = players
    .filter((p) => p.profit > 0.01)
    .map((p) => ({ name: p.name, amount: p.profit }));

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    transfers.push({
      from: debtors[i].name,
      to: creditors[j].name,
      amount: Math.round(amount * 100) / 100,
    });
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
  return transfers;
};
