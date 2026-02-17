export function getRankBadge(index: number): string {
  const badges: string[] = ["🥇", "🥈", "���"];
  return badges[index] ?? `#${index + 1}`;
}
