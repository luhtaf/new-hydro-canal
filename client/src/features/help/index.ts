/**
 * Barrel publik slice `help`. Router meng-spread `helpRoutes`.
 * Konten (SHORTCUTS/GLOSSARY/FAQ) di-export agar bisa dipakai ulang
 * (mis. command palette "cari istilah" nanti).
 */
export { helpRoutes } from './routes.js';
export { default as HelpPage } from './HelpPage.js';
export { FaqAccordion } from './FaqAccordion.js';
export {
  SHORTCUTS,
  GLOSSARY,
  FAQ,
  CONTACTS,
  type Shortcut,
  type GlossaryEntry,
  type FaqItem,
  type ContactLink,
} from './content.js';
