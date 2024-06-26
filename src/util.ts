/**
 * Binary search that returns the position `x` should be in
 */
export function binarySearch(a: number[], x: number) {
  let l = 0, r = a.length - 1;

  while (true) {
    let i = Math.floor((l+r)/2);

    if (a[i] < x) {
      l = i + 1;
      if (l > r) return l;
    } else if (a[i] > x) {
      r = i - 1;
      if (r < l) return i;
    } else {
      return i;
    }
  }
}

/**
 * Binary search that returns the position `x` should be in, using the `end`
 * property of objects in the `a` array
 */
export function binarySearchOf<T>(
  a: T[],
  x: number,
  end: (item: T) => number
): number {
  let l = 0, r = a.length - 1;

  if (r < 0) return -1;

  while (true) {
    let i = Math.floor((l+r)/2);

    if (end(a[i]) < x) {
      l = i + 1;
      if (l > r) return l;
    } else if (end(a[i]) > x) {
      r = i - 1;
      if (r < l) return i;
    } else {
      return i;
    }
  }
}

/**
 * Binary search that returns the position `x` should be in, using the second
 * value in a tuple in the `a` array
 */
export function binarySearchTuple<T>(a: [T, number][], x: number): number {
  let l = 0, r = a.length - 1;

  if (r < 0) return -1;

  while (true) {
    let i = Math.floor((l+r)/2);

    if (a[i][1] < x) {
      l = i + 1;
      if (l > r) return l;
    } else if (a[i][1] > x) {
      r = i - 1;
      if (r < l) return i;
    } else {
      return i;
    }
  }
}

let _id = 0;
export function id(): string {
  return String(_id++);
}

export function loggableText(text: string): string {
  return text.replace(/\n/g, '⏎').replace(/\t/g, '␉');
}

export function basename(p: string) {
  return p.match(/([^.\/]+)\.[A-z]+$/)?.[1] || p;
}
