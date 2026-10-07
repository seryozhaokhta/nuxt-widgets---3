import type { ReelVariant } from '~/reel/time'
import * as timeline from './timeline'
import * as kinetic from './kinetic'
import * as wall from './wall'

export const variants: ReelVariant[] = [
    {
        id: 'timeline',
        title: 'A · Timeline',
        description: 'One take through 12,000 years: the year counter leads from the map to a painting, to cards that fold into nodes.',
        duration: timeline.DURATION,
        bpm: timeline.BPM,
        mood: 'pulse',
        sounds: timeline.SOUNDS,
        component: () => import('./Timeline.vue'),
    },
    {
        id: 'kinetic',
        title: 'B · Kinetic',
        description: 'A fast poster-style edit on a 120 bpm grid: words slam in on beats between close-ups of the widgets.',
        duration: kinetic.DURATION,
        bpm: kinetic.BPM,
        mood: 'drive',
        sounds: kinetic.SOUNDS,
        component: () => import('./Kinetic.vue'),
    },
    {
        id: 'wall',
        title: 'C · Wall label',
        description: 'Slow and quiet: the map flies to where each work was made, in its year; the work fades in with a museum label.',
        duration: wall.DURATION,
        bpm: wall.BPM,
        mood: 'ambient',
        sounds: wall.SOUNDS,
        component: () => import('./Wall.vue'),
    },
]
