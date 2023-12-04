export function hashStr(input: string): number {
  let hash = 0;
  const enc = new TextEncoder().encode(input);
  for(let char of enc) {
    hash = ((hash << 5) - hash) + char;
    hash &= 0xFFFF; // Convert to usize int
  }
  return hash;
}

export function hashAny(input: any): number {
  if(!input) return 0;
  switch(typeof input) {
    case "string":
      return hashStr(input);
    case "number":
      return input;
    case "bigint":
      return hashStr(input.toString())
    case "boolean":
      return input ? 1 : 0;
    case "symbol":
      return hashStr(input.toString());
    case "object":
      let toHash: any;
      if(input instanceof Map) {
        toHash = input.entries();
      }
      else if(input instanceof Set) {
        toHash = Array.from(input);
      }
      else {
          return Date.now();
      }
      return hashAny(JSON.stringify(toHash));
  }

  return hashStr(JSON.stringify(input));
}
