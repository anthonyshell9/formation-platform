// Types pour les formations interactives immersives

// ============== THEME ==============
export interface ScenarioTheme {
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  font?: string
}

// ============== BACKGROUND ==============
export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video'

export interface SolidBackground {
  type: 'solid'
  color: string
}

export interface GradientBackground {
  type: 'gradient'
  colors: string[] // Array of colors for gradient
  direction?: 'to-bottom' | 'to-right' | 'to-bottom-right' | 'to-top-right' | 'radial'
}

export interface ImageBackground {
  type: 'image'
  url: string
  overlay?: string // Overlay color with opacity (e.g., "rgba(0,0,0,0.5)")
  position?: 'center' | 'top' | 'bottom'
  size?: 'cover' | 'contain'
}

export interface VideoBackground {
  type: 'video'
  url: string
  overlay?: string
  loop?: boolean
  muted?: boolean
}

export type Background = SolidBackground | GradientBackground | ImageBackground | VideoBackground

// ============== AUDIO & SUBTITLES ==============
export interface Subtitle {
  start: number // seconds
  end: number // seconds
  text: string
}

export interface AudioConfig {
  url: string
  autoplay?: boolean
  loop?: boolean
}

// ============== ANIMATIONS ==============
export type AnimationType =
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'rotate'
  | 'flip'
  | 'blur-in'
  | 'typewriter'
  | 'none'

export interface AnimationConfig {
  type: AnimationType
  duration?: number // milliseconds
  delay?: number // milliseconds
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

// ============== INTERACTIVE ELEMENTS ==============
export interface InteractiveElement {
  id: string
  type: 'button' | 'input' | 'choice' | 'hotspot' | 'drag-item'
  position?: { x: number; y: number } // percentage position
  size?: { width: number; height: number } // percentage size
  content?: string
  action?: ElementAction
  style?: Record<string, string>
}

export interface ElementAction {
  type: 'navigate' | 'show-popup' | 'play-audio' | 'external-link' | 'next-slide'
  target?: string
  data?: Record<string, unknown>
}

// ============== SLIDE TYPES ==============

// Base slide interface
export interface BaseSlide {
  id: string
  order: number
  background?: Background
  animation?: AnimationConfig
  audio?: AudioConfig
  subtitles?: Subtitle[]
  duration?: number // Auto-advance duration in seconds
}

// Title slide - Full screen title with optional subtitle
export interface TitleSlide extends BaseSlide {
  type: 'title'
  title: string
  subtitle?: string
  titleColor?: string
  subtitleColor?: string
  titleAnimation?: AnimationConfig
  subtitleAnimation?: AnimationConfig
  titleStyle?: {
    fontSize?: string
    fontWeight?: string
    color?: string
    textAlign?: 'left' | 'center' | 'right'
  }
}

// Scenario slide - Narration with animation
export interface ScenarioSlide extends BaseSlide {
  type: 'scenario'
  title?: string
  titleColor?: string
  elements?: ScenarioElement[]
  showSubtitles?: boolean
  subtitleStyle?: {
    backgroundColor?: string
    textColor?: string
    position?: 'top' | 'center' | 'bottom'
  }
}

export interface ScenarioElement {
  id: string
  type: 'image' | 'icon' | 'text' | 'lottie' | 'video'
  content: string // URL or text
  color?: string // Text color
  position?: { x: number; y: number }
  size?: { width?: number; height?: number }
  animation?: AnimationConfig
  timingStart?: number // When to show (seconds)
  timingEnd?: number // When to hide (seconds)
}

// Content slide - Text + image/illustration
export interface ContentSlide extends BaseSlide {
  type: 'content'
  layout: 'text-left' | 'text-right' | 'text-top' | 'text-bottom' | 'text-center' | 'split-50' | 'split-60-40' | 'split-40-60'
  title?: string
  titleColor?: string
  text: string // Supports markdown
  textColor?: string
  image?: {
    url: string
    alt?: string
    animation?: AnimationConfig
  }
  textAnimation?: AnimationConfig
  bullets?: string[] // Optional bullet points
}

// Carousel slide - Swipable cards
export interface CarouselSlide extends BaseSlide {
  type: 'carousel'
  title?: string
  titleColor?: string
  items: CarouselItem[]
  autoPlay?: boolean
  autoPlayInterval?: number
  showArrows?: boolean
  showDots?: boolean
}

export interface CarouselItem {
  id: string
  image?: string
  title: string
  description?: string
  link?: string
}

// Quote slide - Centered quote/statement
export interface QuoteSlide extends BaseSlide {
  type: 'quote'
  quote: string
  quoteColor?: string
  accentColor?: string
  author?: string
  authorTitle?: string
  authorImage?: string
}

// Interactive slide - Contains exercises (connects to existing interactive content)
export interface InteractiveSlide extends BaseSlide {
  type: 'interactive'
  interactiveType: 'quiz' | 'drag-drop' | 'matching' | 'fill-blank' | 'sorting' | 'flashcards' | 'hotspot'
  config: Record<string, unknown> // Configuration for the interactive element
  title?: string
  titleColor?: string
  instructions?: string
  showScore?: boolean
}

// Video slide - Full screen video
export interface VideoSlide extends BaseSlide {
  type: 'video'
  videoUrl: string
  autoPlay?: boolean
  controls?: boolean
  loop?: boolean
  muted?: boolean
  poster?: string
  title?: string
  titleColor?: string
}

// Comparison slide - Before/After or Side by Side
export interface ComparisonSlide extends BaseSlide {
  type: 'comparison'
  layout: 'side-by-side' | 'before-after'
  leftTitle?: string
  rightTitle?: string
  leftContent: {
    type: 'image' | 'text'
    content: string
  }
  rightContent: {
    type: 'image' | 'text'
    content: string
  }
}

// Timeline slide - Events in chronological order
export interface TimelineSlide extends BaseSlide {
  type: 'timeline'
  title?: string
  titleColor?: string
  lineColor?: string
  events: TimelineEvent[]
  orientation?: 'horizontal' | 'vertical'
}

export interface TimelineEvent {
  id: string
  date?: string
  title: string
  description?: string
  image?: string
}

// Stats slide - Display statistics/metrics
export interface StatsSlide extends BaseSlide {
  type: 'stats'
  title?: string
  titleColor?: string
  valueColor?: string
  labelColor?: string
  stats: StatItem[]
  layout?: 'grid' | 'row'
  animateCountUp?: boolean
}

export interface StatItem {
  id: string
  value: number | string
  label: string
  icon?: string
  suffix?: string
  prefix?: string
  color?: string
}

// Image gallery slide
export interface GallerySlide extends BaseSlide {
  type: 'gallery'
  title?: string
  titleColor?: string
  images: GalleryImage[]
  layout: 'grid' | 'masonry' | 'carousel'
  columns?: 2 | 3 | 4
}

export interface GalleryImage {
  id: string
  url: string
  caption?: string
  alt?: string
}

// Union type for all slides
export type Slide =
  | TitleSlide
  | ScenarioSlide
  | ContentSlide
  | CarouselSlide
  | QuoteSlide
  | InteractiveSlide
  | VideoSlide
  | ComparisonSlide
  | TimelineSlide
  | StatsSlide
  | GallerySlide

// ============== SCENARIO (FORMATION) ==============
export interface Scenario {
  version: string
  title: string
  description?: string
  theme: ScenarioTheme
  settings: ScenarioSettings
  slides: Slide[]
}

export interface ScenarioSettings {
  navigation: 'vertical' | 'horizontal' | 'free' // free = can jump to any slide
  showProgress: boolean
  progressStyle: 'dots' | 'bar' | 'numbers' | 'none'
  showNavArrows: boolean
  allowKeyboardNavigation: boolean
  allowSwipeNavigation: boolean
  showExitButton: boolean
  showAudioControls: boolean
  autoAdvance: boolean
  autoAdvanceDelay?: number // seconds
  transitionDuration: number // milliseconds
  transitionType: 'fade' | 'slide' | 'zoom' | 'none'
}

// ============== PLAYER STATE ==============
export interface PlayerState {
  currentSlide: number
  totalSlides: number
  isPlaying: boolean // For audio
  isMuted: boolean
  audioProgress: number
  completedSlides: number[]
  startedAt?: Date
  interactions: SlideInteraction[]
}

export interface SlideInteraction {
  slideId: string
  timestamp: Date
  type: 'viewed' | 'completed' | 'skipped' | 'interaction'
  data?: Record<string, unknown>
}

// ============== EDITOR STATE ==============
export interface EditorState {
  scenario: Scenario
  selectedSlideId: string | null
  isDirty: boolean
  undoStack: Scenario[]
  redoStack: Scenario[]
  previewMode: boolean
}

// ============== DEFAULT VALUES ==============
export const DEFAULT_THEME: ScenarioTheme = {
  primaryColor: '#00A693',
  secondaryColor: '#0A4D4A',
  accentColor: '#F59E0B',
  backgroundColor: '#0A0A0A',
  textColor: '#FFFFFF',
  font: 'Inter',
}

export const DEFAULT_SETTINGS: ScenarioSettings = {
  navigation: 'vertical',
  showProgress: true,
  progressStyle: 'dots',
  showNavArrows: true,
  allowKeyboardNavigation: true,
  allowSwipeNavigation: true,
  showExitButton: true,
  showAudioControls: true,
  autoAdvance: false,
  transitionDuration: 500,
  transitionType: 'fade',
}

export const createEmptyScenario = (title: string = 'Nouvelle formation'): Scenario => ({
  version: '1.0',
  title,
  theme: DEFAULT_THEME,
  settings: DEFAULT_SETTINGS,
  slides: [
    {
      id: 'slide-1',
      type: 'title',
      order: 0,
      title: title,
      subtitle: 'Cliquez pour commencer',
      background: {
        type: 'gradient',
        colors: ['#0A4D4A', '#00A693'],
        direction: 'to-bottom-right',
      },
    },
  ],
})
