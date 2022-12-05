// Copyright (C) 2022 Matt Howlett
// This file is part of Infumap.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.


// TODO (LOW): improve efficiency.

const CHARSET: &'static str = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";


/// Encode a byte array of length 16 to a base 62 string of length 22.
/// Encoding is consistent with the corresponding implementation in the web project.
pub fn encode(bytes: &[u8; 16]) -> String {
  let mut int : u128 = 0;
  let mut mul : u128 = 1;
  for (i, b) in bytes.iter().enumerate() {
    int = int + *b as u128 * mul;
    if i < 15 { mul = mul * 256; }
  }

  let mut r : String = String::from("");
  while int > 0 {
    r.push(CHARSET.chars().nth((int % 62) as usize).unwrap());
    int /= 62;
  }

  while r.len() < 22 {
    r.push(CHARSET.chars().nth(0).unwrap());
  }

  if r.len() != 22 { panic!(); }

  r
}


/// Enumerates the possible base62 decode errors.
#[derive(Debug)]
#[allow(dead_code)]
pub enum DecodeError {
  UnsupportedSize,
  InvalidCharacter,
  Overflow
}

/// Decode a base62 string of length 22 to a byte array of length 16.
/// Encoding is consistent with the corresponding implementation in the web project.
#[allow(dead_code)]
pub fn decode(s: &str) -> Result<[u8; 16], DecodeError> {
  if s.len() != 22 { return Err(DecodeError::UnsupportedSize); }

  fn pow62(n: usize) -> u128 {
    let mut r: u128 = 1;
    for _ in 1..n { r *= 62; }
    r
  }

  let mut r: u128 = 0;
  for (i, c) in s.chars().enumerate() {
    r = r + pow62(i+1) * CHARSET.find(c).ok_or(DecodeError::InvalidCharacter)? as u128;
  }

  let mut result: [u8; 16] = [0; 16];
  let mut i = 0;
  while r > 0 {
    result[i] = (r % 256) as u8;
    r /= 256;
    i += 1;
    if i == 16 && r > 0 { return Err(DecodeError::Overflow); }
  }

  Ok(result)
}


#[test]
fn test_encode_decode() {
  let bytes = [0; 16];
  let encoded = encode(&bytes);
  let decoded = decode(&encoded).unwrap();
  assert_eq!(bytes, decoded);

  let bytes = [5; 16];
  let encoded = encode(&bytes);
  let decoded = decode(&encoded).unwrap();
  assert_eq!(bytes, decoded);

  let bytes = [255; 16];
  let encoded = encode(&bytes);
  let decoded = decode(&encoded).unwrap();
  assert_eq!(bytes, decoded);

  let mut bytes = [0; 16];
  bytes[8] = 44;
  let encoded = "MJSINmYT04bF0000000000"; // from web implementation.
  let decoded = decode(&encoded).unwrap();
  assert_eq!(bytes, decoded);

  // from web implementation.
  const ID: uuid::Uuid = uuid::uuid!("3d14c109-9934-4717-aef0-be64a95a8550");
  let a = crate::util::base62::encode(&ID.as_bytes());
  assert_eq!("dL0UZCrGigIHrtoVLPKwR2", a);

}
