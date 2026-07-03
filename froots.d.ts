/**
 * Froots Plugin API — type definitions.
 *
 * This package contains TypeScript typings only; there is no runtime code
 * here. The real implementation lives inside the Froots app, which hands
 * your plugin its API object as the argument to `onload`.
 *
 * A plugin's main.js is a plain ES module (no build step required):
 *
 *   export default {
 *     async onload(app) { ... },   // app: FrootsPluginApi
 *     onunload() { ... },          // optional
 *   };
 *
 * Everything registered through the api (commands, events, intervals, DOM
 * listeners) is automatically disposed when the plugin is disabled.
 */

export interface PluginManifest {
  /** Lowercase letters, digits, hyphens. Must match the plugin folder name. */
  id: string;
  name: string;
  /** Semver x.y.z. */
  version: string;
  /** Minimum Froots version the plugin works with. */
  minAppVersion?: string | null;
  description?: string | null;
  author?: string | null;
  authorUrl?: string | null;
  fundingUrl?: string | null;
}

/** A command contributed by a plugin — surfaced in the ⌘K launcher. */
export interface PluginCommand {
  /** Unique within your plugin (namespaced by the app as `<pluginId>:<id>`). */
  id: string;
  name: string;
  callback: () => void | Promise<void>;
}

/**
 * A viewport tab contributed by a plugin — it joins the app's top-level
 * tab switcher next to the built-in Files / Dev / Inbox / Calendar tabs,
 * and is reachable from ⌘K. Registered views are torn down automatically
 * when your plugin is disabled; users can hide the tab in
 * Settings → Plugins without disabling you.
 */
export interface PluginViewRegistration {
  /** View id, unique within your plugin. Lowercase letters, digits, hyphens. */
  id: string;
  /** Tab label shown in the switcher and on tabs. */
  name: string;
  /**
   * Optional lucide icon name in kebab-case (e.g. "kanban",
   * "chart-line" — see lucide.dev/icons). Unknown or missing names fall
   * back to a puzzle piece.
   */
  icon?: string;
  /**
   * Whether the view gets a button in the top-level tab switcher.
   * Default true. Set false for a ⌘K-only surface (like the built-in
   * History / Artifacts sections): reachable from the launcher and
   * `openView`, no tab-strip presence.
   */
  tab?: boolean;
  /**
   * Mount your view into `el`, a plain block-level HTMLElement that fills
   * the content area (it scrolls; style your own layout inside it).
   * Called each time the view becomes visible. Return a cleanup function
   * to run when the view unmounts (navigation away or plugin disable) —
   * clear timers, disconnect observers, etc. Framework-agnostic: build
   * DOM by hand or mount your own renderer.
   */
  render(el: HTMLElement): void | (() => void);
}

/** Knowledge-base tree node. */
export interface PluginKbNode {
  name: string;
  path: string;
  kind: string;
  children?: PluginKbNode[];
}

/** The API object handed to your plugin's onload. */
export interface FrootsPluginApi {
  /** Your plugin's own manifest. */
  manifest: PluginManifest;
  /** Froots app version. */
  version: string;

  commands: {
    /** Register a ⌘K command. Returns an unregister function. */
    add(command: PluginCommand): () => void;
  };

  ui: {
    /** Show an ephemeral toast (auto-dismisses). */
    toast(message: string): void;
    /**
     * Register a viewport tab (see PluginViewRegistration). Appears in
     * the top-level switcher while your plugin is enabled. Returns an
     * unregister function (also runs automatically on disable).
     */
    registerView(view: PluginViewRegistration): () => void;
    /** Navigate to one of your registered views (e.g. from a command). */
    openView(id: string): void;
  };

  kb: {
    /** The global knowledge-base tree. */
    list(): Promise<PluginKbNode[]>;
    /** Read a KB file by tree path (e.g. "Notes/todo.md"). */
    read(path: string): Promise<string>;
    /** Write a KB file by tree path (creates parents as needed). */
    write(path: string, content: string): Promise<void>;
  };

  settings: {
    /** Load your plugin's data.json (null when nothing saved yet). */
    load<T = unknown>(): Promise<T | null>;
    /** Persist your plugin's data.json. */
    save(data: unknown): Promise<void>;
  };

  events: {
    /**
     * Subscribe to an app event (e.g. "config-changed"). Auto-unsubscribed
     * on disable. Returns an unsubscribe function.
     */
    on(name: string, callback: (payload: unknown) => void): () => void;
  };

  /** Track a setInterval id for automatic clearing on disable. */
  registerInterval(id: number): number;
  /** addEventListener with automatic removal on disable. */
  registerDomEvent(
    target: EventTarget,
    event: string,
    callback: (ev: Event) => void,
  ): void;
}

/** What your main.js default export must implement. */
export interface FrootsPlugin {
  onload(app: FrootsPluginApi): void | Promise<void>;
  onunload?(): void | Promise<void>;
}
