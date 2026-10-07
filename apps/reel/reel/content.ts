import type { NodeCardData } from '@art-widgets/node-card'
import type { StoryData } from '@art-widgets/story'

// Content shown in the reels. The playground's texts are placeholders; these
// are short and checked (Wikipedia, the Met's and Gemäldegalerie's notes).

export const venus: StoryData = {
    image: '/assets/sleeping_venus.jpg',
    size: { width: 3017, height: 1882 },
    title: 'Sleeping Venus',
    author: 'Giorgione',
    dated: { start: 1508, end: 1510 },
    stepDuration: 5200,
    points: [
        {
            x: 19.5,
            y: 38,
            title: 'The goddess',
            text: 'Venus sleeps out in the open, one arm folded behind her head.',
        },
        {
            x: 62,
            y: 30,
            title: 'The landscape',
            text: 'Giorgione died in 1510. The landscape and sky are thought to be Titian’s.',
        },
        {
            x: 88,
            y: 64,
            title: 'The lost Cupid',
            text: 'A Cupid once sat at her feet. It was painted over in 1837.',
        },
    ],
}

export const bude: NodeCardData = {
    image: '/assets/guillaume_bude_1467_1540.png',
    title: 'Guillaume Budé',
    author: 'Jean Clouet',
    date: 'c. 1536',
    tag: 'Portrait',
    description:
        'Librarian to Francis I and the leading humanist of sixteenth-century France. Clouet’s only surviving painted portrait.',
    source: { url: 'https://www.metmuseum.org/art/collection/search/435914' },
}

export const bocklin: NodeCardData = {
    image: '/assets/self_portrait_with_death_playing_fiddle.jpg',
    title: 'Self-Portrait with Death Playing the Fiddle',
    author: 'Arnold Böcklin',
    date: '1872',
    tag: 'Portrait',
    description:
        'Painted in Munich. Böcklin listens; Death plays a fiddle with a single string left.',
    source: { url: 'https://www.smb.museum/en/museums-institutions/alte-nationalgalerie/home/' },
}

/** Where and when each artwork was made, for the map. */
export const places = {
    venice: { at: [12.34, 45.44] as [number, number], name: 'Venice' },
    paris: { at: [2.35, 48.86] as [number, number], name: 'Paris' },
    munich: { at: [11.58, 48.14] as [number, number], name: 'Munich' },
}

// ── Las Meninas and the pictures that answer it (research/meninas.md) ──

export const meninas: StoryData = {
    image: '/assets/reel/meninas.jpg',
    size: { width: 3840, height: 4420 },
    title: 'Las Meninas',
    author: 'Diego Velázquez',
    dated: { start: 1656 },
    stepDuration: 6000,
    points: [
        {
            x: 23,
            y: 55,
            title: 'The painter',
            text: 'Velázquez paints himself at work, at a canvas we only see from the back.',
        },
        {
            x: 42,
            y: 56.5,
            title: 'The mirror',
            text: 'The king and queen appear only in the mirror: they stand where we stand.',
        },
        {
            x: 58.5,
            y: 57,
            title: 'The doorway',
            text: 'José Nieto stops in the door, where the lines of the room meet.',
        },
        {
            x: 22.6,
            y: 57.6,
            title: 'The red cross',
            text: 'Painted in after 1659, when Velázquez was made a knight of Santiago.',
        },
    ],
}

export interface Artwork {
    id: string
    image?: string
    size?: { width: number; height: number }
    title: string
    artist: string
    year: number
    place: string
    at?: [number, number]
}

export const works = {
    arnolfini: {
        id: 'arnolfini', image: '/assets/reel/arnolfini.jpg', size: { width: 1920, height: 2627 },
        title: 'The Arnolfini Portrait', artist: 'Jan van Eyck', year: 1434, place: 'Bruges', at: [3.22, 51.21],
    },
    meninas: {
        id: 'meninas', image: '/assets/reel/meninas.jpg', size: { width: 3840, height: 4420 },
        title: 'Las Meninas', artist: 'Diego Velázquez', year: 1656, place: 'Madrid', at: [-3.69, 40.41],
    },
    goya: {
        id: 'goya', image: '/assets/reel/goya.jpg', size: { width: 3840, height: 3131 },
        title: 'The Family of Charles IV', artist: 'Francisco Goya', year: 1800, place: 'Madrid', at: [-3.71, 40.42],
    },
    boit: {
        id: 'boit', image: '/assets/reel/boit.jpg', size: { width: 1920, height: 1922 },
        title: 'The Daughters of Edward Darley Boit', artist: 'John Singer Sargent', year: 1882, place: 'Paris', at: [2.35, 48.86],
    },
    picasso: { id: 'picasso', title: 'Las Meninas, 58 canvases', artist: 'Pablo Picasso', year: 1957, place: 'Cannes' },
    dali: { id: 'dali', title: 'Velázquez Painting the Infanta Margarita…', artist: 'Salvador Dalí', year: 1958, place: '' },
    foucault: { id: 'foucault', title: 'The Order of Things', artist: 'Michel Foucault', year: 1966, place: 'Paris' },
    hamilton: { id: 'hamilton', title: 'Picasso’s Meninas', artist: 'Richard Hamilton', year: 1973, place: '' },
    struth: { id: 'struth', title: 'Museo del Prado', artist: 'Thomas Struth', year: 2005, place: 'Madrid' },
    street: { id: 'street', title: 'Meninas Madrid Gallery', artist: '80 artists', year: 2018, place: 'Madrid' },
} satisfies Record<string, Artwork>
