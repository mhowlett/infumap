// Copyright (C) 2023 Matt Howlett
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

use std::sync::Mutex;

use rocket::{State, http::ContentType};

use crate::db::Db;
use crate::blob::BlobStore;
use crate::web::responders::BlobResponse;
use crate::util::infu::InfuError;

#[get("/blob/<uid>")]
pub fn get(db: &State<Mutex<Db>>, blob_store: &State<Mutex<BlobStore>>, uid: &str) -> Result<BlobResponse, InfuError> {
  let db = db.lock().unwrap();
  let blob_store = blob_store.lock().unwrap();

  let item = db.item.get(&String::from(uid))?;
  let mime_type_string = item.mime_type.as_ref().ok_or(format!("mime type is not available for item '{}'.", uid))?;
  let mime_type = match ContentType::parse_flexible(mime_type_string) {
    Some(s) => s,
    None => ContentType::Binary
  };
  
  let data = blob_store.get(&String::from(uid))?;

  Ok(BlobResponse {
    data,
    mime_type
  })
}
