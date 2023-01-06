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

use rocket::http::ContentType;
use rocket::response::{self, Responder};
use rocket::request::Request;
use rocket::Response;
use std::io::Cursor;



pub struct RawPngImage<T> {
  pub image_data: T
}

impl<'r> Responder<'r, 'static> for RawPngImage<&'static [u8]> {
  fn respond_to(self, _request: &'r Request<'_>) -> response::Result<'static> {
    Response::build()
      .header(ContentType::PNG)
      .sized_body(self.image_data.len(), Cursor::new(self.image_data))
      .ok()
  }
}


pub struct RawIcoImage<T> {
  pub image_data: T
}

impl<'r> Responder<'r, 'static> for RawIcoImage<&'static [u8]> {
  fn respond_to(self, _request: &'r Request<'_>) -> response::Result<'static> {
    Response::build()
      .header(ContentType::Icon)
      .sized_body(self.image_data.len(), Cursor::new(self.image_data))
      .ok()
  }
}

pub struct BlobResponse {
  pub data: Vec<u8>,
  pub mime_type: ContentType,
}

impl<'r> Responder<'r, 'static> for BlobResponse {
  fn respond_to(self, _request: &'r Request<'_>) -> response::Result<'static> {
    Response::build()
      .header(self.mime_type)
      .sized_body(self.data.len(), Cursor::new(self.data))
      .ok()
  }
}

