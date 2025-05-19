const classMap: Record<string, string> = {};

/**
 * @internal
 * @hidden
 */

export function _getUnifiedClassName(input: string): string {
  if (classMap[input]) return classMap[input];

  const shouldClean = input.includes("utc_");
  const base = shouldClean ? input.replace(/utc_\S+\s*/g, "").trim() : input;

  const suffix = [...base.matchAll(/(\w+?)[-_]/g)].map(([, group]) => `_${group}`).join("");

  const unified = `${base} utc${suffix}`;
  classMap[input] = unified;

  return unified;
}
