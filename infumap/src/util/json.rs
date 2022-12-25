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

use serde_json::{Map, Value, Number};
use super::infu::{InfuResult, InfuError};
use super::geometry::Vector;


pub fn get_string_field(map: &Map<String, Value>, field: &str) -> InfuResult<String> {
  Ok(String::from(
    map
      .get(field)
      .ok_or(format!("'{}' field was not specified", field))?
      .as_str()
      .ok_or(format!("'{}' field was not of type 'string'.", field))?
  ))
}

pub fn get_integer_field(map: &Map<String, Value>, field: &str) -> InfuResult<i64> {
  Ok(
    map
      .get(field)
      .ok_or(format!("'{}' field was not specified", field))?
      .as_i64()
      .ok_or(format!("'{}' field was not of type 'i64'.", field))?
  )
}

pub fn get_float_field(map: &Map<String, Value>, field: &str) -> InfuResult<f64> {
  Ok(
    map
      .get(field)
      .ok_or(format!("'{}' field was not specified", field))?
      .as_f64()
      .ok_or(format!("'{}' field was not of type 'f64'.", field))?
  )
}

pub fn get_vector_field(map: &Map<String, Value>, field: &str) -> InfuResult<Vector<f64>> {
  let o = map
    .get(field).ok_or(format!("'{}' field was not specified", field))?
    .as_object()
    .ok_or(format!("'{}' field was not of type 'f64'.", field))?;
  Ok(Vector {
    x: get_float_field(o, "x")?,
    y: get_float_field(o, "y")?
  })
}

pub fn vector_to_object(v: &Vector<f64>) -> InfuResult<Value> {
  let mut vec: Map<String, Value> = Map::new();
  vec.insert(String::from("x"), Value::Number(Number::from_f64(v.x).ok_or(InfuError::new("not a number"))?));
  vec.insert(String::from("y"), Value::Number(Number::from_f64(v.y).ok_or(InfuError::new("not a number"))?));
  Ok(Value::Object(vec))
}
