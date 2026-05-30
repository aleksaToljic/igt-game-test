export function atWrapped<ItemType>(items: readonly ItemType[], index: number): ItemType {
  const { length } = items;
  if (length === 0) {
    throw new RangeError("Cannot index an empty array");
  }
  const wrapped = ((index % length) + length) % length;
  const value = items[wrapped];
  if (value === undefined) {
    throw new RangeError(`Index ${index} resolved out of range for length ${length}`);
  }
  return value;
}
