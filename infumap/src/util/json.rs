// Copyright (C) 2022-2023 Matt Howlett
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

use serde_json::{Map, Value};
use super::infu::InfuResult;
use super::geometry::Vector;


pub fn get_string_field(map: &Map<String, Value>, field: &str) -> InfuResult<Option<String>> {
  let v = match map.get(field) { None => return Ok(None), Some(s) => s };
  if v.is_null() { return Ok(None); }
  Ok(Some(String::from(v.as_str().ok_or(format!("'{}' field was not of type 'string'.", field))?)))
}

pub fn get_integer_field(map: &Map<String, Value>, field: &str) -> InfuResult<Option<i64>> {
  let v = match map.get(field) { None => return Ok(None), Some(s) => s };
  Ok(Some(v.as_i64().ok_or(format!("'{}' field was not of type 'i64'.", field))?))
}

pub fn get_float_field(map: &Map<String, Value>, field: &str) -> InfuResult<Option<f64>> {
  let v = match map.get(field) { None => return Ok(None), Some(s) => s };
  Ok(Some(v.as_f64().ok_or(format!("'{}' field was not of type 'f64'.", field))?))
}

pub fn get_vector_field(map: &Map<String, Value>, field: &str) -> InfuResult<Option<Vector<i64>>> {
  let v = match map.get(field) { None => return Ok(None), Some(s) => s };
  let o = v.as_object().ok_or(format!("'{}' field was not of type 'object'.", field))?;
  Ok(Some(Vector {
    x: get_integer_field(o, "x")?.ok_or("Vector field 'x' was missing.")?,
    y: get_integer_field(o, "y")?.ok_or("Vector field 'y' was missing.")?
  }))
}

pub fn vector_to_object(v: &Vector<i64>) -> InfuResult<Value> {
  let mut vec: Map<String, Value> = Map::new();
  vec.insert(String::from("x"), Value::Number(v.x.into()));
  vec.insert(String::from("y"), Value::Number(v.y.into()));
  Ok(Value::Object(vec))
}

pub fn validate_map_fields(map: &serde_json::Map<String, serde_json::Value>, all_fields: &[&str]) -> InfuResult<()> {
  for (k, _v) in map {
    if all_fields.iter().find(|v| v == &k).is_none() {
      return Err(format!("Map contains unexpected key '{}'.", k).into());
    }
  }
  Ok(())
}
