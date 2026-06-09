export function randomItem<T>(items: T[]): T {
  if (!items.length) {
    throw new Error("Cannot select a random item from an empty list.");
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
