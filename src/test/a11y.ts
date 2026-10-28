import axe from 'axe-core';

/**
 * Runs axe against a rendered subtree and returns readable violations.
 * jsdom has no layout engine, so colour-contrast and region checks are off; those are covered by
 * the manual keyboard/contrast pass listed in docs/ROADMAP.md.
 */
export async function a11yViolations(container: Element): Promise<string[]> {
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  return result.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
  );
}
