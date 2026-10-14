/**
 * Authoritative mapping of UN Sustainable Development Goal numbers (1-17)
 * to their bundled local official SVG icons using standard static asset URL resolution.
 * Compatible with both Vite bundling and standard ESM runtime tests.
 */
export const SDG_LOGOS = {
  1: new URL('../assets/sdg-icons/sdg-1.svg', import.meta.url).href,
  2: new URL('../assets/sdg-icons/sdg-2.svg', import.meta.url).href,
  3: new URL('../assets/sdg-icons/sdg-3.svg', import.meta.url).href,
  4: new URL('../assets/sdg-icons/sdg-4.svg', import.meta.url).href,
  5: new URL('../assets/sdg-icons/sdg-5.svg', import.meta.url).href,
  6: new URL('../assets/sdg-icons/sdg-6.svg', import.meta.url).href,
  7: new URL('../assets/sdg-icons/sdg-7.svg', import.meta.url).href,
  8: new URL('../assets/sdg-icons/sdg-8.svg', import.meta.url).href,
  9: new URL('../assets/sdg-icons/sdg-9.svg', import.meta.url).href,
  10: new URL('../assets/sdg-icons/sdg-10.svg', import.meta.url).href,
  11: new URL('../assets/sdg-icons/sdg-11.svg', import.meta.url).href,
  12: new URL('../assets/sdg-icons/sdg-12.svg', import.meta.url).href,
  13: new URL('../assets/sdg-icons/sdg-13.svg', import.meta.url).href,
  14: new URL('../assets/sdg-icons/sdg-14.svg', import.meta.url).href,
  15: new URL('../assets/sdg-icons/sdg-15.svg', import.meta.url).href,
  16: new URL('../assets/sdg-icons/sdg-16.svg', import.meta.url).href,
  17: new URL('../assets/sdg-icons/sdg-17.svg', import.meta.url).href
};

/**
 * Returns the local official SVG logo URL for the specified SDG goal number.
 * @param {number|string} goalNumber - Goal number (1-17)
 * @returns {string|null} Local SVG asset path or null if invalid
 */
export function getSdgLogo(goalNumber) {
  const num = parseInt(goalNumber, 10);
  return SDG_LOGOS[num] || null;
}

export default SDG_LOGOS;
