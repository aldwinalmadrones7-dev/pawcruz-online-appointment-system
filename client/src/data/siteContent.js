/**
 * siteContent.js — Static marketing copy for the public pages (how-it-works steps,
 * testimonials, FAQs, clinic values, stats and pet-care tips). Not part of the API.
 */
import { FiAward, FiCalendar, FiClock, FiCpu, FiDollarSign, FiHeart, FiSmile, FiUsers } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';

export const HOW_IT_WORKS = [
  {
    icon: LuPawPrint,
    title: 'Pick your pets',
    text: 'Add your dog, cat, rabbit or bird once — then book for one pet or several in the same visit.',
  },
  {
    icon: FiCalendar,
    title: 'Choose a date & time',
    text: 'See real-time 10-minute slots from 9 AM to 7 PM, every day. Taken times are blocked automatically.',
  },
  {
    icon: FiSmile,
    title: 'Meet your vet',
    text: 'Pick a veterinarian who is free at that time. You get a queue number and booking reference instantly.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Bianca Soriano',
    role: 'Fur-mom of Mochi',
    image: '/images/testimonial-1.jpg',
    quote: 'I booked Mochi’s vaccine on my lunch break in under a minute. The queue number meant we barely waited at the clinic!',
  },
  {
    name: 'Ramon Cortez',
    role: 'Fur-dad of Rocky',
    image: '/images/testimonial-2.jpg',
    quote: 'Rocky hates vet visits, but Dr. Redmond was so patient with him. Rebooking online when work came up was a lifesaver.',
  },
  {
    name: 'Lea Mercado',
    role: 'Fur-mom of two cats',
    image: '/images/testimonial-3.jpg',
    quote: 'I booked both my cats in one visit — back-to-back slots with the same vet. Dr. Neil is amazing with nervous cats.',
  },
];

export const FAQS = [
  {
    question: 'How do I book a vet appointment?',
    answer: 'Create a free pet-owner account and add your pets. Then choose the pets, a date, an available time and a veterinarian. You get a booking reference (like PWC-24X7Q) and a queue number right away.',
  },
  {
    question: 'Can I book for more than one pet?',
    answer: 'Yes. Select up to four pets in one booking — each pet gets its own 10-minute slot, back to back, with the same veterinarian.',
  },
  {
    question: 'Can I cancel or rebook online?',
    answer: 'Yes. Open My Appointments to cancel any upcoming visit, or rebook an online booking to a new date, time or vet. Walk-in visits are rebooked at the front desk.',
  },
  {
    question: 'What are your clinic hours?',
    answer: 'We are open Monday to Sunday, 9:00 AM to 7:00 PM. Appointments run in 10-minute intervals, and the last slot starts at 6:50 PM.',
  },
  {
    question: 'How does the live queue work?',
    answer:
      'When you arrive, check in at the front desk with your queue number and you join your vet’s waiting line. Each vet sees one patient at a time, in the order of booked times. If you arrive more than 15 minutes late, you queue from the time you check in. The Live Queue page (in the menu) shows who is with each vet, who is next and the estimated wait. It only shows queue numbers and pet names.',
  },
  {
    question: 'Do you accept walk-ins?',
    answer: 'Yes. Walk-ins get a queue number at the front desk and join the live queue right away, but booking online guarantees your slot and keeps your wait short.',
  },
  {
    question: 'What if my pet has an emergency?',
    answer: 'Call us right away. If your pet is bleeding, having trouble breathing, or may have eaten something toxic, come in immediately.',
  },
];

export const CLINIC_VALUES = [
  { icon: FiHeart, title: 'Compassion first', text: 'Gentle handling, treats on hand and a calm space for anxious pets and their humans.' },
  { icon: FiDollarSign, title: 'Honest peso pricing', text: 'Every service lists its starting price upfront. We explain costs before any treatment.' },
  { icon: FiCpu, title: 'Modern diagnostics', text: 'In-house laboratory, digital records and same-day results for most blood tests.' },
  { icon: FiUsers, title: 'All creatures welcome', text: 'Dogs, cats, rabbits, birds, hamsters, turtles — our vets see them all.' },
];

export const CLINIC_STATS = [
  { icon: FiAward, value: '2', label: 'licensed veterinarians' },
  { icon: FiUsers, value: '5k+', label: 'happy pets treated' },
  { icon: FiSmile, value: '4.9★', label: 'average rating' },
  { icon: FiClock, value: '10 min', label: 'appointment slots' },
];

export const PET_CARE_TIPS = [
  'Keep vaccines on schedule — puppies and kittens need a series of shots before they go outside.',
  'Deworm adult pets every three months, and puppies and kittens more often.',
  'Brush your dog’s teeth a few times a week; dental disease is common after age three.',
  'Never give your pet chocolate, grapes, onions or garlic — they can be toxic.',
  'Fresh water, always. Pets dehydrate quickly in Philippine heat.',
  'Walk dogs early in the morning or after sunset to protect their paws from hot pavement.',
  'A yearly check-up catches problems early — and it’s cheaper than treating them late.',
];
