# AppADay 060: Task Manager

Category: Productivity and Life (P)
Date: 2026-07-06
Live URL: https://augustineiacopelli.github.io/appaday-060-task-manager/

## What it does

A complete task manager, rebuilt from a Google Apps Script tool backed by a Google Doc into a standalone, single-file GitHub Pages app. Add tasks with a priority tag (`*`, `A`, or `B`), location, estimated minutes, and a repeat rule (daily, weekly on a chosen day, monthly by date or by weekday, or yearly). Filter by priority, location, or snoozed status. Mark a task done, snooze it to a future date, export any task as a calendar (.ics) event, or copy its text with one tap.

## Storage approach

There is no backend and no Google account required. The task list lives in the browser's localStorage as a single JSON object, wrapped in try/catch so a blocked or sandboxed storage call never crashes the app. Because localStorage is tied to one browser on one device, the app also includes a manual Export and Import flow, with two import modes. Merge compares each incoming task to what's already on the device by its task text, priority, location, minutes, and repeat rule, folds in completion history and the later still-future snooze date from both sides when it finds a match, keeps the newer copy's other details, and simply appends anything with no match, so importing a backup taken on a different device adds what's new there without discarding what's already here. Replace All is the simpler option: it wholesale overwrites the device's list with whatever is in the imported file, useful for restoring after a browser reset. Both modes show a preview, task counts for Merge, a plain warning for Replace All, before you confirm. Export downloads the entire list as a dated JSON file; keeping that file in Drive, email, or anywhere else gives the list a durable backup independent of any single browser's storage.

Data loss from clearing cookies or site data is a real risk with this approach, since localStorage lives in that same bucket and gets wiped along with it. There is no way to prevent that from inside the app; the export habit is the only real safeguard.

## Reliability: stale tabs and duplicate instances

The app reads localStorage once into memory on load and works from that in-memory copy for the session. Left unguarded, that creates a real bug: if the app is open in two tabs, or iOS Safari revives a backgrounded tab without a full reload, each instance can hold a stale snapshot, and a save from the older one silently overwrites newer changes, snoozes and edits included. Two fixes address this. First, `storage`, `visibilitychange`, and `pageshow` listeners re-read localStorage whenever there's reason to think another instance may have written to it, skipping the refresh while a modal is open so it never disrupts something in progress. Second, on load the app claims an exclusive Web Lock (`navigator.locks`) named `appaday060-task-manager-instance-lock` for the life of the tab; a second tab or window in the same browser that tries to claim it gets `null` back immediately and is shown a full-screen block instead of loading any data, so it can never hold the stale copy that caused the problem in the first place. This is scoped per browser, not per device or across different browsers, so it stops two Safari tabs from colliding but won't stop Safari and Chrome running at once, or the app being open on two separate devices; the resync listeners are what cover those cases instead. Browsers without the Web Locks API fall back to starting normally rather than blocking everyone.

## Notes

Repeat-rule parsing, due-today logic, and the calendar export were carried over largely unchanged from the original Apps Script version. What changed is the data layer: instead of two Google Doc tables (a task table and a state table) reached through `google.script.run`, everything now lives in one flat array of task objects, each carrying its own completion history and snooze date, read and written directly through `window.localStorage`.
