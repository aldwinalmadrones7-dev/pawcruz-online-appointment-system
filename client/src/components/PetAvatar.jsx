/**
 * PetAvatar — Round species icon for a pet (dog, cat, rabbit, bird, reptile, fish…).
 */
import { LuBird, LuCat, LuDog, LuFish, LuPawPrint, LuRabbit, LuRat, LuTurtle } from 'react-icons/lu';
import { getSpeciesFamily } from '../utils/petOptions';

const FAMILY_ICONS = {
  dog: LuDog,
  cat: LuCat,
  rabbit: LuRabbit,
  small: LuRat,
  bird: LuBird,
  reptile: LuTurtle,
  fish: LuFish,
  other: LuPawPrint,
};

export default function PetAvatar({ species, size = 44, className = '' }) {
  const family = getSpeciesFamily(species);
  const Icon = FAMILY_ICONS[family];
  return (
    <span className={`pet-avatar is-${family} ${className}`.trim()} style={{ width: size, height: size, fontSize: Math.round(size * 0.48) }} aria-hidden="true">
      <Icon />
    </span>
  );
}
