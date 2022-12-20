# Infumap

Infumap is a personal knowledge managment (PKM) tool currently under development - incomplete - not at all usable.

## Running

Everything is provided in a self contained executable. To run:

```
infumap web
```

Then point your web browser at `http://localhost:8000`.

## Configuration

The first time you run Infumap, a default settings file and data folder will be created in `~/.infumap/`.

You can instruct Infumap to read the settings file from a custom location (and you can specify a custom data directory in that if you want) like so:

```
infumap web -s path/to/settings.toml
```

You can also specify configuration via environment variables (prefixed with `INFUMAP_`, case insensitive). These will overwrite any values specified in the settings file. Finally, note that if there is no `settings.toml` file, and all mandatory configuration values are specified via env vars (currently this is only `data_dir`), then a default `settings.toml` file will *not* be created.