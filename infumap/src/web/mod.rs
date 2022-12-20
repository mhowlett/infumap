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

mod responders;
mod dist_handlers;

use rocket::response::content::RawJson;
use uuid::{uuid, Uuid};
use std::time::SystemTime;
use totp_rs::{Algorithm, TOTP};
use clap::{App, ArgMatches, Arg};

use crate::{store::{KVStore, user::User}, config::setup_config};


#[get("/gen")]
fn gen() -> String {
  // TODO (HIGH): remove. playing with OTP / base62 uuids.

  const ID: Uuid = uuid!("3d14c109-9934-4717-aef0-be64a95a8550");
  // let key_uuid = uuid::Uuid::new_v4();
  let b = ID.as_bytes().clone();
  let a = super::util::base62::encode(&b);
  println!("{}", a);

  // The secret should be randomly generated of N bits length (look it up)
  let totp = TOTP::new(
    Algorithm::SHA1,
    6,
    1,
    30,
    "hello123123123123123123123123123".as_bytes(),
    Some("infumap".to_string()),
    "math".to_string()
  ).unwrap();
  let time = SystemTime::now()
    .duration_since(SystemTime::UNIX_EPOCH).unwrap()
    .as_secs();
  println!("{}", totp.get_url());
  let token = totp.generate(time);
  println!("{}", token);
  "hello".to_string()
}


#[get("/test-json")]
fn json() -> RawJson<&'static str> {
  // TODO (HIGH): remove. Playing with JSON.
  RawJson("[{ \"test\": \"one\" }, { \"test\": \"two\" }]")
}

pub fn make_clap_subcommand<'a, 'b>() -> App<'a> {
  App::new("web")
    .about("The Infumap web server")
    .arg(Arg::new("settings_path")
      .short('s')
      .long("settings")
      .help(concat!("Path to a toml settings configuration file. If not specified and the required configuration values are not available ",
                    "via env vars, ~/.infumap/settings.toml will be used. If it does not exist, it will created with default values."))
      .takes_value(true)
      .multiple_values(false)
      .required(false))
}

pub async fn handle_command_arg_matches<'a>(sub_matches: &ArgMatches) {

  let config = match setup_config(sub_matches.value_of("settings_path")) {
    Ok(c) => c,
    Err(e) => {
      println!("Could not setup configuration {e}");
      return;
    }
  };

  let _user_store: KVStore<User> = match KVStore::init(&config.get_string("data_dir").unwrap(), "users.json") {
    Ok(store) => store,
    Err(e) => {
      println!("Could not read user store log: {e}");
      return;
    }
  };

  _ = dist_handlers::mount(
    rocket::build()
      .mount("/", routes![json])
      .mount("/", routes![gen])).launch().await;

}
