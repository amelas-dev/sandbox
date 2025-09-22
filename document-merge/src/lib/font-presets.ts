export interface FontPreset {
  label: string;
  family: string;
  stack: string;
}

export const GOOGLE_FONT_PRESETS: ReadonlyArray<FontPreset> = [
  { label: 'Inter', family: 'Inter', stack: 'Inter, system-ui, sans-serif' },
  { label: 'Roboto', family: 'Roboto', stack: "'Roboto', sans-serif" },
  { label: 'Open Sans', family: 'Open Sans', stack: "'Open Sans', sans-serif" },
  { label: 'Lato', family: 'Lato', stack: "'Lato', sans-serif" },
  { label: 'Montserrat', family: 'Montserrat', stack: "'Montserrat', sans-serif" },
  { label: 'Source Sans Pro', family: 'Source Sans Pro', stack: "'Source Sans Pro', sans-serif" },
  { label: 'Poppins', family: 'Poppins', stack: "'Poppins', sans-serif" },
  { label: 'Work Sans', family: 'Work Sans', stack: "'Work Sans', sans-serif" },
  { label: 'Nunito', family: 'Nunito', stack: "'Nunito', sans-serif" },
  { label: 'PT Sans', family: 'PT Sans', stack: "'PT Sans', sans-serif" },
  { label: 'PT Serif', family: 'PT Serif', stack: "'PT Serif', serif" },
  { label: 'IBM Plex Sans', family: 'IBM Plex Sans', stack: "'IBM Plex Sans', sans-serif" },
  { label: 'Merriweather', family: 'Merriweather', stack: "'Merriweather', serif" },
  { label: 'Raleway', family: 'Raleway', stack: "'Raleway', sans-serif" },
  { label: 'Fira Sans', family: 'Fira Sans', stack: "'Fira Sans', sans-serif" },
  { label: 'Playfair Display', family: 'Playfair Display', stack: "'Playfair Display', serif" },
  { label: 'Rubik', family: 'Rubik', stack: "'Rubik', sans-serif" },
  { label: 'Josefin Sans', family: 'Josefin Sans', stack: "'Josefin Sans', sans-serif" },
  { label: 'Mulish', family: 'Mulish', stack: "'Mulish', sans-serif" },
  { label: 'Bitter', family: 'Bitter', stack: "'Bitter', serif" },
  { label: 'Cabin', family: 'Cabin', stack: "'Cabin', sans-serif" },
  { label: 'Karla', family: 'Karla', stack: "'Karla', sans-serif" },
  { label: 'Outfit', family: 'Outfit', stack: "'Outfit', sans-serif" },
  { label: 'Heebo', family: 'Heebo', stack: "'Heebo', sans-serif" },
];

export const FONT_PRESET_STACKS = new Set(GOOGLE_FONT_PRESETS.map((font) => font.stack));
export const GOOGLE_FONT_FAMILIES = GOOGLE_FONT_PRESETS.map((font) => font.family);
