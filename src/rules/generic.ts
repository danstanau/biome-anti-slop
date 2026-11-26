import type { AnyJsAstNode } from "@biomejs/runtime/plugin";
import { ast, defineRule, registerDiagnostic } from "@biomejs/runtime/plugin";
import {
  descendants,
  directChild,
  isAssertion,
  memberName,
} from "../shared/ast.ts";

function moduleRule(run: (root: AnyJsAstNode) => void) {
  return defineRule({
    query: ast("JS_MODULE"),
    run,
  });
}

function nodes(root: AnyJsAstNode, kind: string): AnyJsAstNode[] {
  return descendants(root, (node) => node.kind === kind);
}

function callMethod(node: AnyJsAstNode): string | undefined {
  if (node.kind !== "JS_CALL_EXPRESSION") return undefined;
  return memberName(directChild(node, "JS_STATIC_MEMBER_EXPRESSION"));
}

export const noArrayFilterMap = moduleRule((root) => {
  for (const call of nodes(root, "JS_CALL_EXPRESSION")) {
    const outerMethod = callMethod(call);
    if (outerMethod !== "map" && outerMethod !== "filter") continue;
    const callee = directChild(call, "JS_STATIC_MEMBER_EXPRESSION");
    const innerCall = callee
      ?.children()
      .find((child) => child.kind === "JS_CALL_EXPRESSION");
    if (!innerCall) continue;
    const innerMethod = callMethod(innerCall);
    if (
      innerMethod === (outerMethod === "map" ? "filter" : "map") &&
      directChild(
        directChild(innerCall, "JS_STATIC_MEMBER_EXPRESSION") ?? innerCall,
        "JS_ARRAY_EXPRESSION",
      )
    ) {
      registerDiagnostic(
        call,
        "error",
        "Avoid adjacent eager array filter/map passes; use one transformation or a supported iterator pipeline.",
      );
    }
  }
});

export const noReduceAccumulatorCopy = moduleRule((root) => {
  for (const call of nodes(root, "JS_CALL_EXPRESSION")) {
    if (callMethod(call) !== "reduce" && callMethod(call) !== "reduceRight") {
      continue;
    }
    const match = call.text.match(
      /\.reduce(?:Right)?\s*\(\s*(?:\(\s*([$A-Z_a-z][$\w]*)|([$A-Z_a-z][$\w]*))/u,
    );
    const accumulator = match?.[1] ?? match?.[2];
    if (!accumulator) continue;
    const copiesAccumulator = new RegExp(
      String.raw`(?:Object\.assign\s*\(\s*\{\s*\}\s*,\s*${accumulator}\b|Array\.from\s*\(\s*${accumulator}\b|${accumulator}\s*\.\s*(?:concat|slice|toSpliced|toSorted|toReversed|with)\s*\()`,
      "u",
    ).test(call.text);
    if (copiesAccumulator) {
      registerDiagnostic(
        call,
        "error",
        "Avoid copying reducer state on each iteration; mutate a fresh local accumulator instead.",
      );
      return;
    }
  }
});

export const noChainedTypeAssertions = moduleRule((root) => {
  for (const assertion of descendants(root, isAssertion)) {
    const parent = assertion.parent;
    if (!isAssertion(parent)) continue;
    if (/\bas\s+const(?:\s+as\s+const)+$/u.test(parent.text.trim())) {
      continue;
    }
    registerDiagnostic(
      parent,
      "error",
      "Avoid chained type assertions; validate or transform the value once.",
    );
  }
});

export const noConditionalEmptyObjectSpread = moduleRule((root) => {
  for (const spread of nodes(root, "JS_SPREAD")) {
    if (
      spread.text.includes("?") &&
      /(?:\?\s*\{\s*\}|:\s*\{\s*\})/u.test(spread.text)
    ) {
      registerDiagnostic(
        spread,
        "error",
        "Avoid conditional object spreads with an empty-object branch; construct the object conditionally.",
      );
    }
  }
});

export const noKnownValueWidening = moduleRule((root) => {
  for (const declarator of nodes(root, "JS_VARIABLE_DECLARATOR")) {
    const match = declarator.text.match(
      /:\s*(?:unknown|object|\{\s*\}|Record\s*<\s*string\s*,\s*(?:unknown|object)\s*>)[\s\S]*?=\s*([\s\S]+)$/u,
    );
    if (
      match?.[1] &&
      !/^(?:undefined|null|\{\s*\})\s*;?$/u.test(match[1].trim())
    ) {
      registerDiagnostic(
        declarator,
        "error",
        "Preserve the known value's inferred type; use `satisfies` when checking a broader contract.",
      );
    }
  }
});

export const noModuleMocking = moduleRule((root) => {
  for (const call of nodes(root, "JS_CALL_EXPRESSION")) {
    if (
      /^(?:vi|jest)\s*\.\s*(?:mock|doMock|unstable_mockModule)\s*\(/u.test(
        call.text,
      )
    ) {
      registerDiagnostic(
        call,
        "error",
        "Avoid module mocking; replace dependencies through a real interface or test implementation.",
      );
    }
  }
});

export const noObjectParameters = moduleRule((root) => {
  for (const parameter of nodes(root, "JS_FORMAL_PARAMETER")) {
    if (/\s*[$\w]+\s*:\s*object(?:\s*[|&][\s\S]*)?$/u.test(parameter.text)) {
      registerDiagnostic(
        parameter,
        "error",
        "Avoid broad object parameters; accept a specific structural contract.",
      );
    }
  }
});

export const noReflectApply = moduleRule((root) => {
  for (const call of nodes(root, "JS_CALL_EXPRESSION")) {
    if (/^Reflect\s*\.\s*apply\s*\(/u.test(call.text)) {
      registerDiagnostic(
        call,
        "error",
        "Avoid `Reflect.apply`; call the function with its typed arguments.",
      );
    }
  }
});

export const noReflectGet = moduleRule((root) => {
  for (const call of nodes(root, "JS_CALL_EXPRESSION")) {
    if (/^Reflect\s*\.\s*get\s*\(/u.test(call.text)) {
      registerDiagnostic(
        call,
        "error",
        "Avoid `Reflect.get`; use typed property access or parse dynamic input.",
      );
    }
  }
});

export const noRuntimeTypeof = moduleRule((root) => {
  for (const expression of nodes(root, "JS_BINARY_EXPRESSION")) {
    if (
      /\btypeof\s+[^=!]+\s*(?:===|!==|==|!=)\s*["'][^"']+["']/u.test(
        expression.text,
      ) &&
      !/\btypeof\s+[^=!]+\s*(?:===|!==|==|!=)\s*["']undefined["']/u.test(
        expression.text,
      )
    ) {
      registerDiagnostic(
        expression,
        "error",
        "Use boundary parsing instead of ad hoc `typeof` narrowing.",
      );
    }
  }
});

export const noShapeInSymbolNames = moduleRule((root) => {
  for (const binding of nodes(root, "JS_IDENTIFIER_BINDING")) {
    if (/shape/iu.test(binding.text)) {
      registerDiagnostic(
        binding,
        "error",
        "Avoid `shape` in locally owned symbol names.",
      );
    }
  }
});

export const noUnknownParameters = moduleRule((root) => {
  for (const parameter of nodes(root, "JS_FORMAL_PARAMETER")) {
    if (!/:\s*unknown(?:\s*[|&][\s\S]*)?$/u.test(parameter.text)) continue;
    if (/^\s*cause(?:\??)\s*:\s*unknown/u.test(parameter.text)) continue;
    const fn = parameter
      .ancestors()
      .find((ancestor) =>
        [
          "JS_FUNCTION_DECLARATION",
          "JS_FUNCTION_EXPRESSION",
          "JS_ARROW_FUNCTION_EXPRESSION",
        ].includes(ancestor.kind),
      );
    if (fn && /:\s*.+\s+is\s+.+\s*\{/u.test(fn.text)) {
      continue;
    }
    registerDiagnostic(
      parameter,
      "error",
      "Keep `unknown` at the parsing boundary; narrow it before calling this function.",
    );
  }
});

export const noUnknownReturns = moduleRule((root) => {
  for (const fn of descendants(root, (node) =>
    [
      "JS_FUNCTION_DECLARATION",
      "JS_FUNCTION_EXPRESSION",
      "JS_ARROW_FUNCTION_EXPRESSION",
    ].includes(node.kind),
  )) {
    if (
      /(?:\)|=>)\s*:\s*(?:unknown|Promise\s*<\s*unknown\s*>|PromiseLike\s*<\s*unknown\s*>)/u.test(
        fn.text,
      )
    ) {
      registerDiagnostic(
        fn,
        "error",
        "Avoid explicit `unknown` return contracts; return a domain type or parse at the boundary.",
      );
    }
  }
});

export const noUnknownTypeAliases = moduleRule((root) => {
  for (const alias of nodes(root, "TS_TYPE_ALIAS_DECLARATION")) {
    if (/=\s*unknown\s*;?$/u.test(alias.text)) {
      registerDiagnostic(
        alias,
        "error",
        "Avoid aliases that only rename `unknown`; use a meaningful domain type.",
      );
    }
  }
});

export const noUnsafeDictionaryType = moduleRule((root) => {
  for (const alias of nodes(root, "TS_TYPE_ALIAS_DECLARATION")) {
    if (
      /Record\s*<\s*string\s*,\s*(?:unknown|any|object|\{\s*\})\s*>|\{\s*\[\s*[$\w]+\s*:\s*string\s*\]\s*:\s*(?:unknown|any|object|\{\s*\})/u.test(
        alias.text,
      )
    ) {
      registerDiagnostic(
        alias,
        "error",
        "Avoid unsafe open dictionary values; use a precise value type or a generic constraint.",
      );
    }
  }
});

export const noWidenThenAssert = moduleRule((root) => {
  const source = root.text;
  for (const declarator of nodes(root, "JS_VARIABLE_DECLARATOR")) {
    const match = declarator.text.match(
      /^\s*([$A-Z_a-z][$\w]*)\s*:\s*(?:unknown|any|object)\s*=\s*[$A-Z_a-z][$\w]*/u,
    );
    const name = match?.[1];
    if (
      name &&
      new RegExp(String.raw`\b${name}\s+as\s+[$A-Z_a-z]`, "u").test(source)
    ) {
      registerDiagnostic(
        declarator,
        "error",
        "Avoid widening a known value and asserting it back; keep the original evidence.",
      );
    }
  }
});
