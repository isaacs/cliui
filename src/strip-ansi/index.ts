import { ansiRegex } from "../ansi-regex/index.js";
const regex = ansiRegex();
export const stripAnsi = (str: string) => str.replace(regex, "");
