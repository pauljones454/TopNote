// Curated pairings for the home page "Signature Scents" section.
//
// Every entry here requires a real, checkable, published source — a named
// outlet, a direct quote or clearly reported claim, and a URL that resolves.
// Do not add a pairing without one, and do not soften, embellish, or
// "improve" the `note` beyond what the source actually supports. These are
// factual attributions about real people; treat `sourceQuote` as the
// ground truth the `note` line must stay faithful to.
//
// `fragranceId` must match a real `fragrances.id` in the Supabase catalog —
// verify before adding or changing an entry.

export type SignatureScentConfidence = 'direct_quote' | 'reported' | 'historic'

export interface SignatureScent {
  /** The person the pairing is attributed to. */
  celebrity: string
  /** Must match an existing `fragrances.id` in the catalog. */
  fragranceId: string
  /** One short editorial line, faithful to sourceQuote — no embellishment. */
  note: string
  /** URL of the published source. */
  sourceUrl: string
  /** Name of the publication or outlet. */
  sourceName: string
  /** The exact quote or reported claim the note is drawn from. */
  sourceQuote: string
  /** How directly the source ties the person to the fragrance. */
  confidence: SignatureScentConfidence
}

export const signatureScents: SignatureScent[] = [
  {
    celebrity: 'Marilyn Monroe',
    fragranceId: 'chanel-no5',
    note: 'Told Time in 1952 it was the only thing she wore to bed.',
    sourceUrl: 'https://time.com/archive/6794806/cinema-something-for-the-boys/',
    sourceName: 'TIME',
    sourceQuote: 'In bed, she claims, she wears "only Chanel No. 5,"',
    confidence: 'historic',
  },
  {
    celebrity: 'Audrey Hepburn',
    fragranceId: 'givenchy-linterdit-givenchy',
    note: 'Givenchy created it for her alone in 1957 — the first celebrity fragrance.',
    sourceUrl: 'https://www.independent.co.uk/arts-entertainment/fashion-going-lightly-audrey-hepburn-was-dressed-by-givenchy-for-nearly-40-years-marion-hume-describes-more-than-a-professional-relationship-1473040.html',
    sourceName: 'The Independent',
    sourceQuote: "Givenchy created a perfume inspired by Hepburn which was called L'Interdit because, initially, nobody else but she could have it. (The first celebrity fragrance, it went on sale in 1957).",
    confidence: 'historic',
  },
  {
    celebrity: 'Adele',
    fragranceId: 'dior-hypnotic-poison-dior',
    note: 'Same bottle since age 15, confirmed on Australia\u2019s 60 Minutes.',
    sourceUrl: 'https://www.billboard.com/music/pop/adele-60-minutes-interview-australia-6770372/',
    sourceName: 'Billboard',
    sourceQuote: "I wouldn't wear my own perfume... I'll always wear the same perfume I've always worn since I was 15. [...] And which scent is that? Christian Dior Hypnotic Poison.",
    confidence: 'direct_quote',
  },
  {
    celebrity: 'Rihanna',
    fragranceId: 'kilian-love',
    note: "Kilian's own founder confirms she wore it both times they met.",
    sourceUrl: 'https://www.harpersbazaar.com/beauty/a35312659/rihanna-perfume-kilian-love-dont-be-shy-extreme/',
    sourceName: "Harper's Bazaar",
    sourceQuote: 'The two times that I met her, she was wearing it.',
    confidence: 'reported',
  },
  {
    celebrity: 'Beyonc\u00e9',
    fragranceId: 'kilian-angels-share',
    note: 'Named as her pick after a Renaissance-tour trip to Harrods.',
    sourceUrl: 'https://www.harpersbazaar.com/uk/beauty/fragrance/g22099334/perfumes-celebrities-really-wear/',
    sourceName: "Harper's Bazaar UK",
    sourceQuote: "Her scent of choice has been revealed to be Angels' Share by Kilian.",
    confidence: 'reported',
  },
  {
    celebrity: 'Marisa Abela',
    fragranceId: 'chanel-coco-mademoiselle-chanel',
    note: "Never without the travel spray, per Bazaar's own beauty-bag series.",
    sourceUrl: 'https://www.harpersbazaar.com/uk/beauty/fragrance/g22099334/perfumes-celebrities-really-wear/',
    sourceName: "Harper's Bazaar UK",
    sourceQuote: "She's never without the travel version of Coco Mademoiselle, an opulent, lasting blend of rose and jasmine.",
    confidence: 'reported',
  },
  {
    celebrity: 'Gillian Anderson',
    fragranceId: 'diptyque-orpheon',
    note: 'Named it herself on camera, tied to a childhood memory.',
    sourceUrl: 'https://www.harpersbazaar.com/uk/beauty/fragrance/g22099334/perfumes-celebrities-really-wear/',
    sourceName: "Harper's Bazaar UK",
    sourceQuote: 'This one is called Orph\u00e9on, and it smells really nice. I had one of these as a kid so it brings up a lot of memories.',
    confidence: 'direct_quote',
  },
  {
    celebrity: 'Elizabeth Olsen',
    fragranceId: 'diptyque-philosykos-diptyque',
    note: "Says it's the only scent she wears without getting a headache.",
    sourceUrl: 'https://www.harpersbazaar.com/uk/beauty/fragrance/g22099334/perfumes-celebrities-really-wear/',
    sourceName: "Harper's Bazaar UK",
    sourceQuote: "I prefer the fig from Diptyque and that's the only kind of scent I use.",
    confidence: 'direct_quote',
  },
  {
    celebrity: 'Jodie Comer',
    fragranceId: 'santal',
    note: 'Copied it off a co-worker years ago and it stuck.',
    sourceUrl: 'https://www.harpersbazaar.com/uk/beauty/fragrance/g22099334/perfumes-celebrities-really-wear/',
    sourceName: "Harper's Bazaar UK",
    sourceQuote: 'I was working with someone years ago who wore it and I thought it was delicious, so I copied her \u2013 and now it\u2019s mine!',
    confidence: 'reported',
  },
  {
    celebrity: 'Rosie Huntington-Whiteley',
    fragranceId: 'byredo-gypsy',
    note: 'Calls it her all-time ultimate fragrance on her own platform.',
    sourceUrl: 'https://www.harpersbazaar.com/uk/beauty/fragrance/g22099334/perfumes-celebrities-really-wear/',
    sourceName: "Harper's Bazaar UK",
    sourceQuote: 'The model and beauty entrepreneur shared that the woody aromatic perfume is her "all-time ultimate fragrance."',
    confidence: 'reported',
  },
]
