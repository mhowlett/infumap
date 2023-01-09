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

use crate::storage::db::Db;
use crate::storage::file::FileStore;
use crate::web::responders::FileResponse;
use crate::util::infu::InfuError;

#[get("/files/<uid>")]
pub fn get(db: &State<Mutex<Db>>, file_store: &State<Mutex<FileStore>>, uid: &str) -> Result<FileResponse, InfuError> {
  let db = db.lock().unwrap();
  let file_store = file_store.lock().unwrap();

  let item = db.item.get(&String::from(uid))?;
  let mime_type_string = item.mime_type.as_ref().ok_or(format!("mime type is not available for item '{}'.", uid))?;
  let mime_type = match ContentType::parse_flexible(mime_type_string) {
    Some(s) => s,
    None => ContentType::Binary
  };
  
  let data = file_store.get(&String::from(uid))?;

  Ok(FileResponse {
    data,
    mime_type
  })
}
