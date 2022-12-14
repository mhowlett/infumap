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

use std::error::Error;
use std::fmt::{Display, Formatter};
use std::time::SystemTimeError;
use rocket::response::{self, Responder};
use rocket::request::Request;

pub type InfuResult<T> = Result<T, InfuError>;


#[derive(Debug)]
pub struct InfuError {
  message: String
}

impl Display for InfuError {
  fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), std::fmt::Error> {
    write!(f, "{}", self.message)
  }
}

impl Error for InfuError {
  fn source(&self) -> Option<&(dyn Error + 'static)> {
    None
  }
}

impl InfuError {
  pub fn new(message: &str) -> InfuError {
    InfuError { message: message.to_string() }
  }
}

impl From<serde_json::Error> for InfuError {
  fn from(err: serde_json::Error) -> Self {
    Self::new(&err.to_string())
  }
}

impl From<std::io::Error> for InfuError {
  fn from(err: std::io::Error) -> Self {
    Self::new(&err.to_string())
  }
}

impl From<SystemTimeError> for InfuError {
  fn from(err: SystemTimeError) -> Self {
    Self::new(&err.to_string())
  }
}

impl From<String> for InfuError {
  fn from(err: String) -> Self {
    Self::new(&err)
  }
}

impl From<&str> for InfuError {
  fn from(err: &str) -> Self {
    Self::new(&err)
  }
}

impl<'r> Responder<'r, 'static> for InfuError {
  fn respond_to(self, request: &'r Request<'_>) -> response::Result<'static> {
    rocket::response::status::BadRequest(Some(self.message)).respond_to(request)
  }
}
