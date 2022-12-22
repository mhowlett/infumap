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

use rocket::{State, serde::json::Json};
use serde::{Deserialize, Serialize};
use crate::store::Store;


#[derive(Deserialize)]
pub struct SendRequest {
  _username: String,
  _session_id: String,
  _command: String,
}

#[derive(Serialize)]
pub struct SendResponse {
}

#[post("/command", data = "<_payload>")]
pub fn send(_store: &State<Store>, _payload: Json<SendRequest>) -> Json<SendResponse> {
  Json(SendResponse {})
}
