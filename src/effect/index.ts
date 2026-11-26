import type { AnyJsAstNode, RuleContext } from "@biomejs/runtime/plugin";
import { ast, defineRule, registerDiagnostic } from "@biomejs/runtime/plugin";
import { descendants, directChild, memberName } from "../shared/ast.ts";

function moduleRule(run: (root: AnyJsAstNode, context: RuleContext) => void) {
  return defineRule({
    query: ast("JS_MODULE"),
    run,
  });
}

function matching(
  root: AnyJsAstNode,
  kind: string,
  pattern: RegExp,
): AnyJsAstNode[] {
  return descendants(
    root,
    (node) => node.kind === kind && pattern.test(node.text),
  );
}

export const noManualEffectErrorTag = moduleRule((root) => {
  for (const call of descendants(
    root,
    (node) =>
      node.kind === "JS_CALL_EXPRESSION" &&
      /^catch(?:All|If)?$/u.test(
        memberName(directChild(node, "JS_STATIC_MEMBER_EXPRESSION")) ?? "",
      ) &&
      /^Effect\s*\.\s*catch/u.test(
        directChild(node, "JS_STATIC_MEMBER_EXPRESSION")?.text ?? "",
      ),
  )) {
    if (/_tag\s*(?:===|!==|==|!=)/u.test(call.text)) {
      registerDiagnostic(
        call,
        "error",
        "Use a tagged Effect catch operator instead of branching on `_tag` inside a broad catch handler.",
      );
    }
  }
});

export const noManualTagComparison = moduleRule((root) => {
  for (const expression of matching(
    root,
    "JS_BINARY_EXPRESSION",
    /(?:\._tag\s*(?:===|!==|==|!=)|(?:===|!==|==|!=)\s*.*\._tag)/u,
  )) {
    registerDiagnostic(
      expression,
      "error",
      "Use Effect `Match` or `Predicate.isTagged` instead of comparing `_tag` directly.",
    );
  }
  for (const statement of matching(
    root,
    "JS_SWITCH_STATEMENT",
    /switch\s*\([^)]*\._tag/u,
  )) {
    registerDiagnostic(
      statement,
      "error",
      "Use Effect `Match` instead of switching on `_tag`.",
    );
  }
});

export const noManualTaggedConstruction = moduleRule((root) => {
  for (const object of matching(
    root,
    "JS_OBJECT_EXPRESSION",
    /^\{\s*_tag\s*:/u,
  )) {
    const enclosingCall = object
      .ancestors()
      .find((ancestor) => ancestor.kind === "JS_CALL_EXPRESSION");
    if (
      enclosingCall &&
      /^Match\.(?:when|not)\s*\(/u.test(enclosingCall.text)
    ) {
      continue;
    }
    registerDiagnostic(
      object,
      "error",
      "Use the existing Schema, tagged class/error, or tagged-enum constructor.",
    );
  }
});

export const noServiceConstructorImports = moduleRule((root, context) => {
  if (/\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(context.filePath)) return;
  const importMatch = [
    ...root.text.matchAll(/\bimport\s*\{([^}]+)\}\s*from\s*["']\.\.?\//gu),
  ].find((match) => /\bmake[A-Z][A-Za-z0-9_$]*/u.test(match[1] ?? ""));
  const serviceFactory = importMatch?.[1].match(
    /\bmake[A-Z][A-Za-z0-9_$]*/u,
  )?.[0];
  if (!serviceFactory) return;
  const declaration = descendants(
    root,
    (node) => node.kind === "JS_IMPORT",
  ).find((node) => node.text.includes(serviceFactory));
  registerDiagnostic(
    declaration ?? root,
    "error",
    "Import the owning Effect Layer and yield the contextual service instead of importing its constructor.",
  );
});

export const preferEffectMatch = moduleRule((root) => {
  for (const expression of matching(root, "JS_CONDITIONAL_EXPRESSION", /\?/u)) {
    const [test, , alternate] = expression.children();
    const [nestedTest] = alternate?.children() ?? [];
    const subject = test?.text.match(/^(.+?)\s*===?\s*["'][^"']+["']$/u)?.[1];
    const nestedSubject = nestedTest?.text.match(
      /^(.+?)\s*===?\s*["'][^"']+["']$/u,
    )?.[1];
    if (subject && subject === nestedSubject) {
      registerDiagnostic(
        expression,
        "error",
        "Use Effect `Match` instead of chained literal ternaries.",
      );
    }
  }
});
