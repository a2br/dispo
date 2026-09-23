import type { Locale } from "../config";
import { en, type Messages } from "./en";
import { fr } from "./fr";
import { de } from "./de";

export type { Messages };

export const messages: Record<Locale, Messages> = { en, fr, de };
