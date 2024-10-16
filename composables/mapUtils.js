// composables/mapUtils.js

export function formatYearTooltip(value) {
  const absValue = Math.abs(value);
  const era = value < 0 ? "BCE" : "CE";
  return `${absValue} ${era}`;
}
