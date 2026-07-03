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

## API surface (v2)

| Call | Does |
|---|---|
| `app.commands.add({id, name, callback})` | Register a ⌘K command ("Plugin commands" group) |
| `app.ui.toast(message)` | Ephemeral toast |
| `app.ui.registerView({id, name, icon, render})` | **Register a viewport TAB** — your own top-level surface next to Files / Dev / Inbox (see below) |
| `app.ui.openView(id)` | Navigate to one of your registered views |
| `app.kb.list()` / `read(path)` / `write(path, md)` | The user's knowledge base |
| `app.settings.load()` / `save(obj)` | Your plugin's `data.json` |
| `app.events.on(name, cb)` | App events (e.g. `config-changed`) |
| `app.registerInterval(id)` / `app.registerDomEvent(t, e, cb)` | Auto-cleaned side effects |
| `app.manifest` / `app.version` | Your manifest; the app version |

See [`froots.d.ts`](froots.d.ts) for the full, documented definitions.

## Views — your own tab in the app

`registerView` is the "plugins-as-tabs" surface: your view joins the
top-level viewport switcher (the same row as Files, Dev, Inbox, Calendar…),
gets a tab title, shows up in ⌘K, and can be hidden by the user in
Settings → Plugins. Views are torn down automatically when your plugin is
disabled.

```js
export default {
  /** @param {FrootsPluginApi} app */
  async onload(app) {
    app.ui.registerView({
      id: "board",
      name: "Board",
      icon: "kanban",           // any lucide.dev icon name, kebab-case
      render(el) {
        el.innerHTML = `<div style="padding:24px">
          <h1 style="font-size:15px;margin:0 0 8px">My Board</h1>
          <p style="opacity:.6;font-size:13px">Rendered by a plugin.</p>
        </div>`;
        const timer = setInterval(() => console.log("tick"), 5_000);
        return () => clearInterval(timer);   // cleanup on unmount
      },
    });

    // Optional: a command that jumps to the view.
    app.commands.add({
      id: "open-board",
      name: "Open Board",
      callback: () => app.ui.openView("board"),
    });
  },
};
```

Don't want a tab? Pass `tab: false` and your view becomes a **⌘K-only
surface** — it shows in the launcher's "Go to" list and opens via
`app.ui.openView`, but takes no space in the tab switcher (the app's own
History and Artifacts sections work the same way). Good for occasional
surfaces like a log viewer, a stats page, or a settings-ish dashboard.

Rules of the road:

- `render(el)` runs every time the view becomes visible; the returned
  cleanup runs when it unmounts. Don't assume a single mount per session.
- `el` is a plain scrollable container that fills the content area.
  Style inside it however you like — hand-rolled DOM, or mount your own
  framework (`styles.css` in your plugin folder is injected while you're
  enabled, so classes work too).
- A throw inside `render` is contained to your view's surface with an
  inline error — it won't take down the app, but users will see it.
- View state you care about should live in your `data.json`
  (`app.settings`) or the KB — the DOM is disposable.

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
