import type { AnyJsAstNode } from "@biomejs/runtime/plugin";

export function descendants(
  root: AnyJsAstNode,
  predicate: (node: AnyJsAstNode) => boolean,
): AnyJsAstNode[] {
  const found: AnyJsAstNode[] = [];
  const visit = (node: AnyJsAstNode) => {
    for (const child of node.children()) {
      if (predicate(child)) found.push(child);
      visit(child);
    }
  };
  visit(root);
  return found;
}

export function directChild(
  node: AnyJsAstNode,
  kind: string,
): AnyJsAstNode | undefined {
  return node.children().find((child) => child.kind === kind);
}

export function hasAncestor(
  node: AnyJsAstNode,
  predicate: (node: AnyJsAstNode) => boolean,
): boolean {
  return node.ancestors().some(predicate);
}

export function isAssertion(
  node: AnyJsAstNode | undefined,
): node is AnyJsAstNode {
  return (
    node?.kind === "TS_AS_EXPRESSION" ||
    node?.kind === "TS_TYPE_ASSERTION_EXPRESSION"
  );
}

export function memberName(node: AnyJsAstNode | undefined): string | undefined {
  if (
    node?.kind !== "JS_STATIC_MEMBER_EXPRESSION" &&
    node?.kind !== "JS_COMPUTED_MEMBER_EXPRESSION"
  ) {
    return undefined;
  }
  const match = node.text.match(/(?:\.|\[\s*["'])([$\w]+)(?:["']\s*\])?$/u);
  return match?.[1];
}
