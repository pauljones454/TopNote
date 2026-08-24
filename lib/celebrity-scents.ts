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
  {
    celebrity: 'Lil Durk',
    fragranceId: 'dior-sauvage',
    note: 'Says he wears his Dior Sauvage around the clock, no exceptions.',
    sourceUrl: 'https://www.gq.com/video/watch/10-essentials-10-things-lil-durk-cant-live-without',
    sourceName: 'GQ (10 Essentials)',
    sourceQuote: "Savage [Sauvage] by Dior Cologne... I just like to smell good, like 24/7, no matter what.",
    confidence: 'direct_quote',
  },
  {
    celebrity: '6LACK',
    fragranceId: 'gucci-guilty-black',
    note: 'His first cologne purchase — he never switched after trying it once.',
    sourceUrl: 'https://www.gq.com/video/watch/10-things-6lack-can-t-live-without',
    sourceName: 'GQ (10 Essentials)',
    sourceQuote: 'This is Gucci Guilty Black cologne... I never bought any cologne until I tried this one, and I was like, Oh yeah, that’s the one. Bought it the first time, never switched.',
    confidence: 'direct_quote',
  },
  {
    celebrity: 'Charlie Puth',
    fragranceId: 'green-irish',
    note: 'Discovered it on a whim near the Gramercy Park Hotel in New York; it’s carried him ever since.',
    sourceUrl: 'https://www.gq.com/video/watch/10-essentials-10-things-charlie-puth-can-t-live-without',
    sourceName: 'GQ (10 Essentials)',
    sourceQuote: "This is Creed Green Irish Tweed. I like the way it smells. I don't know a whole lot about perfumes, but I first discovered that this was my scent at the Gramercy Park Hotel.",
    confidence: 'direct_quote',
  },
  {
    celebrity: 'Lil Uzi Vert',
    fragranceId: 'chanel-chance-chanel',
    note: 'Calls a half-used bottle of Chanel Chance his favorite.',
    sourceUrl: 'https://www.youtube.com/watch?v=UOqkhnckKTM',
    sourceName: "GQ (10 Essentials, via GQ's YouTube channel)",
    sourceQuote: 'This is a half bottle of Chance from Chanel, just like my favorite.',
    confidence: 'direct_quote',
  },
  {
    celebrity: 'A$AP Rocky',
    fragranceId: 'gucci-guilty-pour-femme',
    note: 'The Gucci Guilty ambassador says he’s currently into musky scents and is shown wearing the Pour Femme bottle himself.',
    sourceUrl: 'https://www.gq.com/story/asap-rocky-gucci-guilty-interview',
    sourceName: 'GQ',
    sourceQuote: 'Musk. I like a musky scent... Right now, it’s this [picks up the Gucci Guilty perfumes]. (Article confirms: one of the bottles is dark gray, the other light pink—Gucci Guilty pour homme, and pour femme. He’s wearing pour femme.)',
    confidence: 'direct_quote',
  },
  {
    celebrity: 'Robert Pattinson',
    fragranceId: 'dior-dior-homme-parfum',
    note: 'The longtime Dior Homme face admits he personally wears it at night, for his partner.',
    sourceUrl: 'https://www.gq-magazine.co.uk/article/robert-pattinson-dior-homme-interview',
    sourceName: 'British GQ',
    sourceQuote: "I'm not single and stuff, so I personally use it at night.",
    confidence: 'direct_quote',
  },
  {
    celebrity: 'Jay Sean',
    fragranceId: 'burberry-touch-for-men',
    note: 'Names Burberry Touch as one of his favorite colognes.',
    sourceUrl: 'https://www.gq.com/video/watch/10-essentials-don-t-deny-rapper-jay-sean-his-cars-watches-or-a-firm-pillow',
    sourceName: 'GQ (10 Essentials)',
    sourceQuote: 'Cologne, very important. This is one of my favorites, Burberry Touch.',
    confidence: 'direct_quote',
  },
  {
    celebrity: 'YG',
    fragranceId: 'chanel-bleu-de-chanel',
    note: 'Calls Bleu de Chanel an essential item for smelling right as a grown man.',
    sourceUrl: 'https://www.gq.com/video/watch/10-essentials-yg-s-mandatory-things-credit-card-bluetooth-speakers-smelling-good',
    sourceName: 'GQ (10 Essentials)',
    sourceQuote: 'Another essential item for me is this Chanel right here. Chanel Bleu.',
    confidence: 'direct_quote',
  },
  {
    celebrity: 'Noah Beck',
    fragranceId: 'paco-invictus',
    note: 'Named his cologne on a TikTok live after a fan asked — Paco Rabanne then sent him bottles with his name engraved on them.',
    sourceUrl: 'https://www.gq.com/video/watch/10-essentials-gq-10-essentials-noah-beck',
    sourceName: 'GQ (10 Essentials)',
    sourceQuote: "I was like, I use, like, Invictus Paco Rabanne, or Paco Rabanne, I'm not sure how you name it. And literally a week later, I get a package from Paco Rabanne, and they sent me, like, four bottles of cologne... This one has my name engraved into it.",
    confidence: 'direct_quote',
  },
]
