import type { ThreadConfig, Picture } from './types'

// The "Threads" series. Facts and sources: apps/reel/research/series.md.
// Image points and boxes are percentages of each picture.

const img = (name: string, width: number, height: number): Picture => ({
    src: `/assets/reel/${name}.jpg`,
    size: { width, height },
})

const P = {
    hiroshigeBridge: img('hiroshige-bridge', 2629, 3840),
    vangoghBridge: img('vangogh-bridge', 2791, 3840),
    hiroshigePlum: img('hiroshige-plum', 1920, 2822),
    vangoghPlum: img('vangogh-plum', 3221, 3840),
    wave: img('hokusai-wave', 3840, 2581),
    laMer: img('debussy-la-mer', 600, 786),
    castagno: img('castagno-supper', 1507, 650),
    ghirlandaio: img('ghirlandaio-supper', 1373, 750),
    leonardo: img('leonardo-supper', 3840, 1920),
    tintoretto: img('tintoretto-supper', 1337, 850),
    monaLisa: img('mona-lisa', 2538, 3840),
    doni: img('raphael-maddalena-doni', 1723, 2500),
    corot: img('corot-pearl', 2713, 3840),
    stolen: img('mona-lisa-1911', 640, 887),
}

const END = {
    line: ['Every picture', 'answers another.'],
    lead: ['Threads of influence: one of the', 'mechanics for telling the history of art.'],
}

const EDO: [number, number] = [139.69, 35.69]
const PARIS: [number, number] = [2.35, 48.86]
const FLORENCE: [number, number] = [11.26, 43.77]
const MILAN: [number, number] = [9.19, 45.46]

export const japan: ThreadConfig = {
    id: 'threads-japan',
    title: 'Threads 01 · Japan → Van Gogh',
    description: 'Van Gogh copies two Hiroshige prints; Debussy puts Hokusai’s wave on La Mer.',
    series: 'Threads · 01 / 03',
    bpm: 100,
    scenes: [
        {
            kind: 'still', duration: 3.2, picture: P.vangoghBridge, year: 1887,
            from: { x: 55, y: 63, zoom: 2.3 }, to: { x: 50, y: 50, zoom: 1 },
            captions: [['This is a Van Gogh.'], ['Paris, 1887.']],
            chapter: { n: '01', title: 'The copy' }, context: 'Van Gogh · Bridge in the Rain',
        },
        {
            kind: 'compare', duration: 4.8, years: [1857, 1887],
            type: 'Copy', note: 'Same bridge, same rain, new colours',
            footnote: 'He owned about 50 of Hiroshige’s landscapes',
            context: 'Hiroshige → Van Gogh', counterSide: 'right',
            top: {
                ...P.hiroshigeBridge, meta: '1857 · Hiroshige', title: 'Sudden Shower over Ōhashi',
                focus: { x: 46, y: 64 }, zoom: 1.25,
                boxes: [{ x: 24, y: 55, w: 50, h: 15 }, { x: 11, y: 48.5, w: 40, h: 6 }],
            },
            bottom: {
                ...P.vangoghBridge, meta: '1887 · Van Gogh', title: 'Bridge in the Rain',
                focus: { x: 50, y: 58 }, zoom: 1.2,
                boxes: [{ x: 32, y: 56, w: 44, h: 15 }, { x: 20, y: 49.5, w: 34, h: 6 }],
            },
        },
        {
            kind: 'flight', duration: 4.0, years: [1857, 1887],
            from: { at: EDO, label: 'EDO · 1857' }, to: { at: PARIS, label: 'PARIS · 1887' },
            caption: ['Japan opens its ports.', 'Its prints sail west.'],
            chapter: { n: '02', title: 'The journey' }, context: 'Edo → Paris',
        },
        {
            kind: 'compare', duration: 3.4, years: [1857, 1887],
            type: 'And again', note: 'The plum tree, turned up to red',
            context: 'Hiroshige → Van Gogh',
            top: {
                ...P.hiroshigePlum, meta: '1857 · Hiroshige', title: 'Plum Park in Kameido',
                focus: { x: 50, y: 45 }, zoom: 1.0, boxes: [],
            },
            bottom: {
                ...P.vangoghPlum, meta: '1887 · Van Gogh', title: 'Flowering Plum Orchard',
                focus: { x: 50, y: 40 }, zoom: 1.0, boxes: [],
            },
        },
        {
            kind: 'still', duration: 2.6, picture: P.wave, year: 1831,
            from: { x: 38, y: 32, zoom: 1.7 }, to: { x: 45, y: 45, zoom: 1.05 },
            captions: [['Another print,', 'another answer.']], intoStory: true,
            chapter: { n: '03', title: 'The wave' }, context: 'Hokusai · The Great Wave',
        },
        {
            kind: 'story', duration: 5.0, year: 1831, width: 420, scale: 0.9,
            data: {
                image: P.wave.src, size: P.wave.size, title: 'The Great Wave off Kanagawa', author: 'Katsushika Hokusai',
                dated: { start: 1831 }, stepDuration: 9000,
                points: [
                    { x: 38, y: 24, title: 'The wave', text: 'The crest breaks into claws of foam.' },
                    { x: 63.8, y: 67.5, title: 'Mount Fuji', text: 'The subject of the series is the smallest thing in the picture.' },
                    { x: 22, y: 62, title: 'The boats', text: 'Three boats of rowers duck under the wave.' },
                ],
            },
            taps: [{ at: 1.7, button: 'next' }, { at: 3.4, button: 'next' }],
        },
        {
            kind: 'compare', duration: 4.6, years: [1831, 1905],
            type: 'Cover', note: 'Debussy puts the wave on La Mer',
            context: 'Hokusai → Debussy',
            top: {
                ...P.wave, meta: 'c. 1831 · Hokusai', title: 'The Great Wave',
                focus: { x: 38, y: 32 }, zoom: 1.3,
                boxes: [{ x: 17, y: 8, w: 44, h: 50 }],
            },
            bottom: {
                ...P.laMer, meta: '1905 · Debussy', title: 'La Mer, first edition',
                focus: { x: 40, y: 50 }, zoom: 1.0,
                boxes: [{ x: 1, y: 26, w: 80, h: 50 }],
            },
        },
        {
            kind: 'graph', duration: 5.6, chapter: { n: '04', title: 'Threads' },
            hub: {
                id: 'prints', year: 1831, yearLabel: '1830s–1850s', name: 'Edo prints',
                picture: { ...P.wave, x: 40, y: 30, span: 4 },
            },
            nodes: [
                { id: 'hiroshige', year: 1857, name: 'Hiroshige', picture: { ...P.hiroshigeBridge, x: 50, y: 62, span: 4 } },
                { id: 'vangogh', year: 1887, name: 'Van Gogh', picture: { ...P.vangoghBridge, x: 55, y: 63, span: 4 },
                    lines: ['“All my work is based', 'on Japanese art.”'] },
                { id: 'monet', year: 1899, name: 'Monet', lines: ['Monet hangs 200-odd', 'prints at Giverny.'] },
                { id: 'debussy', year: 1905, name: 'Debussy', picture: { ...P.laMer, x: 40, y: 45, span: 3 },
                    lines: ['Debussy chooses the', 'wave for La Mer.'] },
            ],
        },
        { kind: 'end', duration: 4.4, ...END },
    ],
}

export const supper: ThreadConfig = {
    id: 'threads-supper',
    title: 'Threads 02 · Where Judas sits',
    description: 'Before Leonardo, Judas sat alone across the table; Leonardo seats him with the others.',
    series: 'Threads · 02 / 03',
    bpm: 100,
    scenes: [
        {
            kind: 'still', duration: 3.4, picture: P.leonardo, year: 1498,
            from: { x: 32, y: 55, zoom: 2.6 }, to: { x: 45, y: 50, zoom: 1 },
            captions: [['Find Judas.'], ['Before Leonardo,', 'it was easy.']],
            chapter: { n: '01', title: 'The rule' }, context: 'Leonardo · The Last Supper',
        },
        {
            kind: 'compare', duration: 4.8, years: [1447, 1480],
            type: 'Rule', note: 'Judas sits alone, on our side of the table',
            footnote: 'Florence: Sant’Apollonia, Ognissanti',
            context: 'Castagno → Ghirlandaio',
            top: {
                ...P.castagno, meta: 'c. 1447 · Castagno', title: 'The Last Supper',
                focus: { x: 42, y: 70 }, zoom: 1.15,
                boxes: [{ x: 37.5, y: 60, w: 9.5, h: 32 }],
            },
            bottom: {
                ...P.ghirlandaio, meta: '1480 · Ghirlandaio', title: 'The Last Supper',
                focus: { x: 50, y: 74 }, zoom: 1.15,
                boxes: [{ x: 46, y: 62, w: 14, h: 33 }],
            },
        },
        {
            kind: 'flight', duration: 3.8, years: [1480, 1495],
            from: { at: FLORENCE, label: 'FLORENCE · 1480' }, to: { at: MILAN, label: 'MILAN · 1495' },
            caption: ['Then Leonardo,', 'in Milan.'],
            chapter: { n: '02', title: 'The break' }, context: 'Florence → Milan',
        },
        {
            kind: 'compare', duration: 4.8, years: [1480, 1498],
            type: 'Break', note: 'Judas sits with the others',
            context: 'Ghirlandaio → Leonardo',
            top: {
                ...P.ghirlandaio, meta: '1480 · Ghirlandaio', title: 'The Last Supper',
                focus: { x: 50, y: 74 }, zoom: 1.15,
                boxes: [{ x: 46, y: 62, w: 14, h: 33 }],
            },
            bottom: {
                ...P.leonardo, meta: '1495–98 · Leonardo', title: 'The Last Supper',
                focus: { x: 36, y: 55 }, zoom: 1.5,
                boxes: [{ x: 28, y: 50, w: 7, h: 18 }],
            },
        },
        {
            kind: 'story', duration: 5.2, year: 1498, width: 440, scale: 0.88,
            data: {
                image: P.leonardo.src, size: P.leonardo.size, title: 'The Last Supper', author: 'Leonardo da Vinci',
                dated: { start: 1495, end: 1498 }, stepDuration: 9000,
                points: [
                    { x: 30.5, y: 55, title: 'Judas', text: 'In shadow, he pulls back, a money bag in his hand.' },
                    { x: 50, y: 46, title: 'The centre', text: 'The lines of the room meet at Christ’s head.' },
                    { x: 50, y: 38, title: 'The window', text: 'The light behind him does the work of a halo.' },
                ],
            },
            taps: [{ at: 1.8, button: 'next' }, { at: 3.6, button: 'next' }],
            chapter: { n: '03', title: 'A closer look' }, context: 'Leonardo · Milan',
        },
        {
            kind: 'graph', duration: 5.8, chapter: { n: '04', title: 'Threads' },
            hub: { id: 'leonardo', year: 1498, name: 'Leonardo', picture: { ...P.leonardo, x: 50, y: 48, span: 7 } },
            nodes: [
                { id: 'castagno', year: 1447, name: 'Castagno', direction: 'in', picture: { ...P.castagno, x: 42, y: 74, span: 6 } },
                { id: 'ghirlandaio', year: 1480, name: 'Ghirlandaio', direction: 'in', picture: { ...P.ghirlandaio, x: 53, y: 76, span: 6 } },
                { id: 'tintoretto', year: 1594, name: 'Tintoretto', picture: { ...P.tintoretto, x: 50, y: 42, span: 5 },
                    lines: ['Tintoretto turns the', 'table on a diagonal.'] },
                { id: 'bunuel', year: 1961, name: 'Buñuel', lines: ['Buñuel’s beggars pose', 'as the apostles.'] },
                { id: 'warhol', year: 1986, name: 'Warhol', lines: ['Warhol prints it', 'again and again.'] },
            ],
        },
        { kind: 'end', duration: 4.4, ...END },
    ],
}

export const monaLisa: ThreadConfig = {
    id: 'threads-mona-lisa',
    title: 'Threads 03 · Mona Lisa’s hands',
    description: 'Raphael borrows her pose; Corot her hands; a theft makes her the most famous face.',
    series: 'Threads · 03 / 03',
    bpm: 100,
    scenes: [
        {
            kind: 'still', duration: 3.2, picture: P.monaLisa, year: 1503,
            from: { x: 40, y: 82, zoom: 2.2 }, to: { x: 50, y: 50, zoom: 1 },
            captions: [['Look at her hands.'], ['Raphael did.']], intoStory: true,
            chapter: { n: '01', title: 'A closer look' }, context: 'Leonardo · Mona Lisa',
        },
        {
            kind: 'story', duration: 5.0, year: 1503, width: 330, scale: 0.8,
            data: {
                image: P.monaLisa.src, size: P.monaLisa.size, title: 'Mona Lisa', author: 'Leonardo da Vinci',
                dated: { start: 1503 }, stepDuration: 9000,
                points: [
                    { x: 40, y: 83, title: 'The hands', text: 'Folded, one over the other: the pose others will copy.' },
                    { x: 44, y: 28, title: 'The smile', text: 'No hard edges at the corners of the mouth.' },
                    { x: 12, y: 32, title: 'The landscape', text: 'The horizon on the left sits lower than on the right.' },
                ],
            },
            taps: [{ at: 1.7, button: 'next' }, { at: 3.4, button: 'next' }],
        },
        {
            kind: 'compare', duration: 4.8, years: [1503, 1506],
            type: 'Pose', note: 'Hands folded, a landscape behind',
            footnote: 'Raphael was in Florence while Leonardo painted it',
            chapter: { n: '02', title: 'The pose' }, context: 'Leonardo → Raphael',
            top: {
                ...P.monaLisa, meta: '1503 · Leonardo', title: 'Mona Lisa',
                focus: { x: 40, y: 82 }, zoom: 1.0,
                boxes: [{ x: 19, y: 74, w: 44, h: 18 }],
            },
            bottom: {
                ...P.doni, meta: 'c. 1506 · Raphael', title: 'Maddalena Doni',
                focus: { x: 41, y: 86 }, zoom: 1.0,
                boxes: [{ x: 24, y: 78, w: 35, h: 20 }],
            },
        },
        {
            kind: 'flight', duration: 3.8, years: [1506, 1869],
            from: { at: FLORENCE, label: 'FLORENCE · 1506' }, to: { at: PARIS, label: 'PARIS · 1869' },
            caption: ['The painting goes', 'to France.'],
            chapter: { n: '03', title: 'The echo' }, context: 'Florence → Paris',
        },
        {
            kind: 'compare', duration: 4.8, years: [1503, 1869],
            type: 'Echo', note: 'The hands, the shadowed eyes',
            footnote: 'A link critics see; Corot left no word of it',
            context: 'Leonardo → Corot',
            top: {
                ...P.monaLisa, meta: '1503 · Leonardo', title: 'Mona Lisa',
                focus: { x: 40, y: 82 }, zoom: 1.0,
                boxes: [{ x: 19, y: 74, w: 44, h: 18 }],
            },
            bottom: {
                ...P.corot, meta: 'c. 1869 · Corot', title: 'Woman with a Pearl',
                focus: { x: 38, y: 88 }, zoom: 1.0,
                boxes: [{ x: 14, y: 80, w: 47, h: 19 }],
            },
        },
        {
            kind: 'still', duration: 3.6, picture: P.stolen, year: 1911,
            from: { x: 40, y: 40, zoom: 1.06 }, to: { x: 40, y: 40, zoom: 1.0 }, framed: true,
            captions: [['August 1911:', 'the wall is empty.'], ['Two years on,', 'she is famous.']],
            note: 'Louvre, Salon Carré, 1911',
            chapter: { n: '04', title: 'The theft' }, context: 'Louvre · Paris',
        },
        {
            kind: 'graph', duration: 5.8, chapter: { n: '05', title: 'Threads' },
            hub: { id: 'mona', year: 1503, name: 'Leonardo', picture: { ...P.monaLisa, x: 45, y: 26, span: 5 } },
            nodes: [
                { id: 'raphael', year: 1506, name: 'Raphael', picture: { ...P.doni, x: 49, y: 25, span: 5 } },
                { id: 'corot', year: 1869, name: 'Corot', picture: { ...P.corot, x: 44, y: 28, span: 5 } },
                { id: 'theft', year: 1911, name: 'The theft', lines: ['Stolen in 1911,', 'back in 1914.'] },
                { id: 'duchamp', year: 1919, name: 'Duchamp', lines: ['Duchamp draws', 'a moustache on her.'] },
                { id: 'warhol', year: 1963, name: 'Warhol', lines: ['Warhol: thirty are', 'better than one.'] },
            ],
        },
        { kind: 'end', duration: 4.4, ...END },
    ],
}

export const series = [japan, supper, monaLisa]
