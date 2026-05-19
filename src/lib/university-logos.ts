export type UniversityLogo = {
  src: string;
  alt: string;
};

/** Bump when replacing files in public/university_logos (cache-bust for browsers + Next image optimizer). */
export const LOGO_ASSET_VERSION = "20260519b";

function logoPath(filename: string): string {
  return `/university_logos/${filename}?v=${LOGO_ASSET_VERSION}`;
}

/** Order: left to right as specified for the top university banner. */
export const UNIVERSITY_LOGOS: UniversityLogo[] = [
  { src: logoPath("imperial-college-london.png"), alt: "Imperial College London" },
  { src: logoPath("university-of-hong-kong.png"), alt: "University of Hong Kong" },
  { src: logoPath("ucl.png"), alt: "UCL (University College London)" },
  { src: logoPath("kings-college-london.png"), alt: "King's College London" },
  { src: logoPath("national-tsing-hua-university.png"), alt: "國立清華大學 (National Tsing Hua University)" },
  { src: logoPath("university-of-the-arts-london.jpg"), alt: "University of the Arts London" },
  { src: logoPath("university-of-macau.png"), alt: "University of Macau" },
  {
    src: logoPath("macau-university-of-science-and-technology.png"),
    alt: "Macau University of Science and Technology",
  },
];
