// Pre-installed cybersecurity background images
export interface BackgroundImage {
  id: string
  url: string
  thumbnail: string
  category: string
  tags: string[]
}

// Generate list of cyber backgrounds
const cyberBackgrounds: BackgroundImage[] = Array.from({ length: 50 }, (_, i) => ({
  id: `cyber-${String(i + 1).padStart(2, '0')}`,
  url: `/backgrounds/cyber/cyber-${String(i + 1).padStart(2, '0')}.jpg`,
  thumbnail: `/backgrounds/cyber/cyber-${String(i + 1).padStart(2, '0')}.jpg`,
  category: 'Cybersécurité',
  tags: getCyberTags(i + 1),
}))

function getCyberTags(index: number): string[] {
  const tagGroups = [
    ['code', 'matrix', 'digital'], // 1-5
    ['hacker', 'dark', 'terminal'],
    ['network', 'data', 'server'],
    ['lock', 'security', 'protection'],
    ['programming', 'developer', 'screen'],
    ['tech', 'abstract', 'blue'], // 6-10
    ['laptop', 'work', 'coding'],
    ['binary', 'cyber', 'green'],
    ['team', 'office', 'modern'],
    ['futuristic', 'neon', 'glow'],
  ]
  return tagGroups[(index - 1) % tagGroups.length]
}

// Preset gradient colors for cybersecurity themes
export const presetGradients = [
  { id: 'cyber-dark', colors: ['#0A0A0A', '#1a1a2e'], name: 'Cyber Dark' },
  { id: 'matrix-green', colors: ['#0d1f0d', '#00ff41'], name: 'Matrix' },
  { id: 'ocean-blue', colors: ['#0A4D4A', '#00A693'], name: 'Ocean' },
  { id: 'midnight', colors: ['#0f0c29', '#302b63', '#24243e'], name: 'Midnight' },
  { id: 'fire', colors: ['#f12711', '#f5af19'], name: 'Fire' },
  { id: 'aurora', colors: ['#00d2ff', '#3a7bd5'], name: 'Aurora' },
  { id: 'sunset', colors: ['#ff6b6b', '#feca57'], name: 'Sunset' },
  { id: 'forest', colors: ['#134E5E', '#71B280'], name: 'Forest' },
  { id: 'royal', colors: ['#141E30', '#243B55'], name: 'Royal Blue' },
  { id: 'emerald', colors: ['#005C53', '#00A693'], name: 'Emerald' },
  { id: 'purple-haze', colors: ['#7028e4', '#e5b2ca'], name: 'Purple Haze' },
  { id: 'deep-space', colors: ['#000000', '#434343'], name: 'Deep Space' },
]

// Preset solid colors
export const presetColors = [
  { id: 'black', color: '#000000', name: 'Noir' },
  { id: 'dark-gray', color: '#1a1a1a', name: 'Gris foncé' },
  { id: 'navy', color: '#0a1628', name: 'Marine' },
  { id: 'dark-green', color: '#0d1f0d', name: 'Vert foncé' },
  { id: 'dark-purple', color: '#1a0a2e', name: 'Violet foncé' },
  { id: 'dark-red', color: '#2a0a0a', name: 'Rouge foncé' },
  { id: 'teal-dark', color: '#0A4D4A', name: 'Teal' },
  { id: 'blue-dark', color: '#0a2540', name: 'Bleu nuit' },
]

// Text colors
export const textColors = [
  { id: 'white', color: '#FFFFFF', name: 'Blanc' },
  { id: 'light-gray', color: '#E5E5E5', name: 'Gris clair' },
  { id: 'cyan', color: '#00D4FF', name: 'Cyan' },
  { id: 'green', color: '#00FF41', name: 'Vert Matrix' },
  { id: 'amber', color: '#FFB800', name: 'Ambre' },
  { id: 'coral', color: '#FF6B6B', name: 'Corail' },
  { id: 'purple', color: '#A78BFA', name: 'Violet' },
  { id: 'teal', color: '#00A693', name: 'Teal' },
]

// Accent colors
export const accentColors = [
  { id: 'teal', color: '#00A693', name: 'Teal' },
  { id: 'cyan', color: '#00D4FF', name: 'Cyan' },
  { id: 'green', color: '#10B981', name: 'Vert' },
  { id: 'blue', color: '#3B82F6', name: 'Bleu' },
  { id: 'purple', color: '#8B5CF6', name: 'Violet' },
  { id: 'pink', color: '#EC4899', name: 'Rose' },
  { id: 'red', color: '#EF4444', name: 'Rouge' },
  { id: 'orange', color: '#F97316', name: 'Orange' },
  { id: 'yellow', color: '#EAB308', name: 'Jaune' },
]

export const backgroundImages = {
  cyber: cyberBackgrounds,
}

export function getAllBackgroundImages(): BackgroundImage[] {
  return [...cyberBackgrounds]
}

export function getBackgroundImagesByCategory(category: string): BackgroundImage[] {
  return getAllBackgroundImages().filter((img) => img.category === category)
}
