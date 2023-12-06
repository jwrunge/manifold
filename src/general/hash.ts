export function hashStr(input: string): number {
  let hash = 0;
  const enc = new TextEncoder().encode(input);
  for(let char of enc) {
    hash = ((hash << 5) - hash) + char;
    hash &= 0xFFFF; // Convert to usize int
  }
  return hash;
}

export function hashAny(input: any): any {
  if(!input) return 0;
  if(typeof input === "object") {
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
  }
  return input;
}
