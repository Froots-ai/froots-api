# Froots Plugin API

Type definitions for building [Froots](https://froots.ai) plugins.

**Typings only.** Like Obsidian's `obsidian` package, this repo contains no
runtime code — the implementation ships inside the Froots app, which passes
your plugin its API object at load time. You never import Froots code; you
just describe its shape for your editor and compiler.

## The plugin model

A Froots plugin is a folder of three files installed at
`<app data>/workspace/plugins/<your-plugin-id>/`:

```
my-plugin/
├── manifest.json   required — id, name, version, minAppVersion, …
├── main.js         required — plain ES module (no build step needed)
└── styles.css      optional — injected while your plugin is enabled
```

`main.js` default-exports the plugin:

```js
// @ts-check
/** @typedef {import("froots-api").FrootsPluginApi} FrootsPluginApi */

export default {
  /** @param {FrootsPluginApi} app */
  async onload(app) {
    app.commands.add({
      id: "hello",
      name: "Say hello",
      callback: () => app.ui.toast(`Hello from ${app.manifest.name}!`),
    });
  },
  onunload() {
    // Everything registered through `app` is cleaned up automatically.
  },
};
```

Everything registered through the api — commands, event subscriptions,
intervals, DOM listeners — is **disposed automatically when your plugin is
disabled**. You only need `onunload` for resources acquired outside the api.

## API surface (v1)

| Call | Does |
|---|---|
| `app.commands.add({id, name, callback})` | Register a ⌘K command ("Plugin commands" group) |
| `app.ui.toast(message)` | Ephemeral toast |
| `app.kb.list()` / `read(path)` / `write(path, md)` | The user's knowledge base |
| `app.settings.load()` / `save(obj)` | Your plugin's `data.json` |
| `app.events.on(name, cb)` | App events (e.g. `config-changed`) |
| `app.registerInterval(id)` / `app.registerDomEvent(t, e, cb)` | Auto-cleaned side effects |
| `app.manifest` / `app.version` | Your manifest; the app version |

See [`froots.d.ts`](froots.d.ts) for the full, documented definitions.

## Developing

Enable community plugins in **Settings → Plugins** (they're off by default —
plugins run unsandboxed third-party code, so Froots ships in restricted
mode). The dev folder is the install folder: edit `main.js`, hit **Reload
plugins**, done. "New plugin" in the same settings page scaffolds a working
template for you.

To get typed autocompletion, add this package as a dev dependency (or copy
`froots.d.ts` next to your `main.js`) and use `// @ts-check` with JSDoc as
above — or write TypeScript and bundle to `main.js` with esbuild
(see [froots-sample-plugin](https://github.com/Froots-ai/froots-sample-plugin)).

## Versioning

The typings track the app. `minAppVersion` in your manifest declares the
oldest Froots your plugin supports.
