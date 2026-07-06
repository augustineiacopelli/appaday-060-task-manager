# AppADay 060: Task Manager

Category: Productivity and Life (P)
Date: 2026-07-06
Live URL: https://augustineiacopelli.github.io/appaday-060-task-manager/

## What it does

A complete task manager, rebuilt from a Google Apps Script tool backed by a Google Doc into a standalone, single-file GitHub Pages app. Add tasks with a priority tag, location, estimated minutes, and a repeat rule (daily, weekly on a chosen day, monthly by date or by weekday, or yearly). Filter by priority, location, or snoozed status. Mark a task done, snooze it to a future date, export any task as a calendar (.ics) event, or copy its text with one tap.

## Storage approach

There is no backend and no Google account required. The task list lives in the browser's localStorage as a single JSON object, wrapped in try/catch so a blocked or sandboxed storage call never crashes the app. Because localStorage is tied to one browser on one device, the app also includes a manual Export and Import flow, with two import modes. Merge compares each incoming task to what's already on the device by its task text, priority, location, minutes, and repeat rule, folds in completion history and the later still-future snooze date from both sides when it finds a match, keeps the newer copy's other details, and simply appends anything with no match, so importing a backup taken on a different device adds what's new there without discarding what's already here. Replace All is the simpler option: it wholesale overwrites the device's list with whatever is in the imported file, useful for restoring after a browser reset. Both modes show a preview, task counts for Merge, a plain warning for Replace All, before you confirm. Export downloads the entire list as a dated JSON file; keeping that file in Drive, email, or anywhere else gives the list a durable backup independent of any single browser's storage.

## Notes

Repeat-rule parsing, due-today logic, and the calendar export were carried over largely unchanged from the original Apps Script version. What changed is the data layer: instead of two Google Doc tables (a task table and a state table) reached through `google.script.run`, everything now lives in one flat array of task objects, each carrying its own completion history and snooze date, read and written directly through `window.localStorage`.
