import type en from './en';

/** Text by count: "one" for exactly one, "other" for the rest */
export interface Plural {
  one: string;
  other: string;
}

export type MessageKey = keyof typeof en;

/** Every language gives every key, with the same shape as English */
export type Dictionary = { [K in MessageKey]: (typeof en)[K] extends string ? string : Plural };
