export function hashStr(input: string): number {
  let hash = 0;
  if (input.length === 0) return hash;

  const enc = new TextEncoder().encode(input);
  for(let char of enc) {
    hash = ((hash << 5) - hash) + char;
    hash &= 0xFFFF; // Convert to usize int
  }
  return hash;
}

export function hashAny(input: any): number {
  let strToHash:string;
  if(input === undefined || input === null) return 0;
  switch(typeof input) {
    case "string":
      strToHash = input;
      break;
    case "number":
      return input;
    case "bigint":
      strToHash = input.toString();
      break;
    case "boolean":
      return input ? 1 : 0;
    case "symbol":
      strToHash = input.toString();
      break;
    case "object":
      if(input instanceof Map) {
        console.log("MAP", input, JSON.stringify(Array.from(input.entries())))
        strToHash = JSON.stringify(Array.from(input.entries()));
      }
      else if(input instanceof Set) {
        console.log("SET", input, JSON.stringify(Array.from(input)))
        strToHash = JSON.stringify(Array.from(input));
      }
      else {
        try {
          strToHash = JSON.stringify(input);
        }
        catch {
          strToHash = Date.now().toString();
        }
      }
      break;
    default:
      strToHash = JSON.stringify(input);
  }

  return hashStr(strToHash);
}
