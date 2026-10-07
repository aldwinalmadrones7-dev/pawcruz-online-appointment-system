/**
 * petOptions.js — Species, breed, color and sex choices for every pet form
 * (adapted from final-vet's petOptions, so both projects offer the same options).
 * Species without a breed list keep a free-text breed field.
 */

export const SPECIES_GROUPS = [
  { label: 'Common household pets', options: ['Dog', 'Cat', 'Rabbit', 'Guinea Pig', 'Hamster', 'Ferret', 'Hedgehog'] },
  { label: 'Birds', options: ['Parrot', 'Cockatiel', 'Budgerigar', 'Lovebird', 'Canary', 'Chicken'] },
  { label: 'Reptiles', options: ['Turtle', 'Tortoise', 'Bearded Dragon', 'Gecko', 'Snake', 'Iguana'] },
  { label: 'Fish', options: ['Goldfish', 'Koi', 'Betta Fish', 'Guppy'] },
  { label: 'Others', options: ['Other'] },
];

export const SPECIES_OPTIONS = SPECIES_GROUPS.flatMap((group) => group.options);

export const SEX_OPTIONS = ['Unknown', 'Male', 'Female'];

export const BREEDS_BY_SPECIES = {
  Dog: [
    'Aspin (Askal)',
    'Labrador Retriever',
    'Golden Retriever',
    'German Shepherd',
    'Poodle',
    'Shih Tzu',
    'Chihuahua',
    'Beagle',
    'Siberian Husky',
    'Pomeranian',
    'Dachshund',
    'French Bulldog',
    'Shiba Inu',
    'Corgi',
    'Japanese Spitz',
    'Mixed Breed',
  ],
  Cat: [
    'Puspin (Domestic Shorthair)',
    'Persian',
    'Siamese',
    'Maine Coon',
    'British Shorthair',
    'Ragdoll',
    'Bengal',
    'Scottish Fold',
    'Himalayan',
    'Mixed Breed',
  ],
  Rabbit: ['Holland Lop', 'Netherland Dwarf', 'Rex', 'Angora', 'Lionhead', 'Mixed Breed'],
};

/** Groups species into the families used for the pet avatar icon. */
export function getSpeciesFamily(species = '') {
  if (species === 'Dog') return 'dog';
  if (species === 'Cat') return 'cat';
  if (['Rabbit'].includes(species)) return 'rabbit';
  if (['Guinea Pig', 'Hamster', 'Ferret', 'Hedgehog'].includes(species)) return 'small';
  if (SPECIES_GROUPS[1].options.includes(species)) return 'bird';
  if (SPECIES_GROUPS[2].options.includes(species)) return 'reptile';
  if (SPECIES_GROUPS[3].options.includes(species)) return 'fish';
  return 'other';
}
