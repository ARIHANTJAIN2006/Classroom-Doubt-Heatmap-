/** Joins truthy class names together. Kept dependency-free on purpose. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
