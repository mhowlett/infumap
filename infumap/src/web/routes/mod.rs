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

use serde_json::{Map, Value};
use crate::util::infu::InfuResult;

pub mod files;
pub mod account;
pub mod command;


pub trait WebApiJsonSerializable<T> {
  fn to_api_json(&self) -> InfuResult<Map<String, Value>>;
  fn from_api_json(map: &Map<String, Value>) -> InfuResult<T>;
}
