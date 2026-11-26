const reflectValue = Reflect.get(input, "name");
const reflected = Reflect.apply(operation, owner, args);
const filtered = [1, 2, 3].filter((value) => value > 1).map(String);
const doubleAssert = input as object as User;
vi.mock("./dependency");
const options = {
  ...(timeout !== undefined ? { timeout } : {}),
};
const copied = [1, 2].reduce((acc, item) => acc.slice().concat(item), []);

function acceptObject(value: object) {
  return value;
}

function isName(value: unknown): value is string {
  return typeof value === "string";
}

function handleUnknown(value: unknown) {
  return value;
}

function loadUnknown(): unknown {
  return input;
}

const userShape = {};
export type ExternalValue = unknown;
export type UnsafeMap = Record<string, unknown>;

const knownValue: User = loadUser();
const widened: unknown = knownValue;
const restored = widened as User;

void [
  reflectValue,
  reflected,
  filtered,
  options,
  copied,
  doubleAssert,
  acceptObject,
  isName,
  handleUnknown,
  loadUnknown,
  userShape,
  ExternalValue,
  UnsafeMap,
  restored,
];
