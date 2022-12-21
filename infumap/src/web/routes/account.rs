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

use rocket::State;
use rocket::response::content::RawJson;
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};
use crate::store::{Store, user::User};


#[derive(Deserialize)]
pub struct LoginParams {
    username: String,
    password: String,
}

#[derive(Serialize)]
pub struct LoginResult {
  success: bool,
  session_id: Option<String>,
  root_page_id: Option<String>,
}

#[post("/account/login", data = "<payload>")]
pub fn login(store: &State<Store>, payload: Json<LoginParams>) -> Json<LoginResult> {
  let user = match store.user_store._get_by_username(&payload.username) {
    Some(u) => u,
    None => { return Json(LoginResult { success: false, session_id: None, root_page_id: None }) }
  };

  let test_hash = User::compute_password_hash(&user.password_salt, &payload.password);
  if test_hash != user.password_hash {
    return Json(LoginResult { success: false, session_id: None, root_page_id: None });
  }

  let result = LoginResult {
    success: true,
    session_id: Some(String::from("session id 234234")),
    root_page_id: Some(user.root_page_id.clone())
  };

  Json(result)
}

#[derive(Deserialize)]
pub struct LogoutParams {
    username: String,
}

#[post("/account/logout", data = "<payload>")]
pub fn logout(_store: &State<Store>, payload: Json<LogoutParams>) -> RawJson<&str> {
  RawJson("[{ \"test\": \"one\" }, { \"test\": \"two\" }]")
}
