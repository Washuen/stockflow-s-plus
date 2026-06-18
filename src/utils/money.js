function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function calculateMargin(profit, revenue) {
  if (!revenue) return 0;
  return (profit / revenue) * 100;
}

module.exports = {
  toNumber,
  calculateMargin
};
