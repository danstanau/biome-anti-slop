import { makeIssueService } from "./issue-service";

const status = result._tag === "Ready" ? "ready" : "pending";
const label = kind === "a" ? "A" : kind === "b" ? "B" : "Other";
const tagged = { _tag: "Ready", value: 1 };
const caught = program.pipe(
  Effect.catch((error) =>
    error._tag === "NotFound" ? recover : Effect.fail(error),
  ),
);

void [makeIssueService, status, label, tagged, caught];
