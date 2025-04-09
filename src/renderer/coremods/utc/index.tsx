const classMap: Record<string, string> = {};

/**
 * @internal
 * @hidden
 */
export function _getUnifiedClassName(str: string): string {
  const cleanStr =
    !classMap[str] && str.includes("unified_") ? str.replace(/unified_\S+\s*/g, "").trim() : str;
  return (classMap[str] ||=
    `${cleanStr} unified${[...cleanStr.matchAll(/(\w+?)[-_]/g)].map(([, c]) => `_${c}`).join("")}`);
}
