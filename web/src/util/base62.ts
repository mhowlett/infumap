/*
  Copyright (C) 2022 Matt Howlett
  This file is part of Infumap.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

export const base62 = {
  encode: (bytes: Uint8Array): string => {
    if (bytes.length != 16) { throw new Error("Array to base62 encode must be 16 bytes."); }

    let integer = BigInt(0);
    let mul = 1n;
    for (let i=0; i<bytes.length; ++i) {
      integer = integer + BigInt(bytes[i]) * mul;
      mul = mul * 256n;
    }

    let s: Array<string> = [];
    while (integer > 0n) {
      s.push(CHARSET[Number(integer % 62n)]);
      integer = integer / 62n;
    }

    while (s.length < 22) { s.push(CHARSET[0]); }

    if (s.length != 22) { throw new Error("Base62 encoded string is too long."); }
  
    return s.join('');
  },

  decode: (encoded: string): Uint8Array => {
    if (encoded.length != 22) { throw new Error("Base62 string to decode must have length 22."); }
  
    let pow62 = (n: number): bigint => {
      let v = 1n;
      for (let i=0; i<n; ++i) { v = v * 62n; }
      return v;
    }

    let chars = encoded.split('');
    let result = 0n;
    for (let i=0; i<chars.length; ++i) {
      result = result + pow62(i) * BigInt(CHARSET.indexOf(chars[i]));
    }

    let r: Array<number> = [];
    while (result > 0n) {
      r.push(Number(result % 256n));
      result = result / 256n;
    }

    while (r.length < 16) { r.push(0); }
  
    return Uint8Array.from(r);
  }
};


export function testEncodeDecode(): void {
  let bytes = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  let encoded = base62.encode(bytes);
  let decoded = base62.decode(encoded);
  console.log(bytes, encoded);
  console.log(decoded);

  bytes = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 44, 0, 0, 0, 0, 0, 0, 0]);
  encoded = base62.encode(bytes);
  decoded = base62.decode(encoded);
  console.log(bytes, encoded);
  console.log(decoded);

  bytes = Uint8Array.from([3, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 0, 0, 0, 0, 255]);
  encoded = base62.encode(bytes);
  decoded = base62.decode(encoded);
  console.log(bytes, encoded);
  console.log(decoded);
}
