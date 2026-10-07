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
