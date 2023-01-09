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

use std::path::PathBuf;

use crate::util::{fs::expand_tilde, infu::InfuResult};

pub struct FileCache {
  _cache_dir: PathBuf
}

impl FileCache {
  pub fn new(cache_dir: &str) -> InfuResult<FileCache> {
    let _cache_dir = expand_tilde(cache_dir).ok_or(format!("File cache path '{}' is not valid.", cache_dir))?;
    Ok(FileCache { _cache_dir })
  }
}
