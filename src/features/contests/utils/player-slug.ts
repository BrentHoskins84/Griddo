import { Player } from '../types/player';

export function generatePlayerSlug(name: string, existingPlayers: Player[]): string {
  const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'player';
  const existingSlugs = new Set(existingPlayers.map((p) => p.slug));

  if (!existingSlugs.has(firstName)) {
    return firstName;
  }

  let counter = 2;
  while (existingSlugs.has(`${firstName}-${counter}`)) {
    counter++;
  }

  return `${firstName}-${counter}`;
}

