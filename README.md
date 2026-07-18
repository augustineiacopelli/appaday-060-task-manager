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

## Cloud sync (optional)

Local storage plus manual Export/Import, described above, still works exactly as before and needs nothing extra. Cloud sync is an optional layer on top for anyone who uses the app on more than one device and wants it to reconcile automatically instead of via manual file hand-offs. It works by pointing the app at your own Google Apps Script Web App, which stores the entire task list as one JSON file in your Drive. There is no shared backend and no third-party server involved; each person who sets this up owns their own copy end to end.

### How it works

Every device with sync configured runs the same cycle on load, whenever the tab becomes visible again, and a couple of seconds after any change you make: pull whatever is currently stored on the server, merge it into the local copy using the exact same content-based matching as the manual Merge import (matching on task text, priority, location, minutes, and repeat rule, keeping the newer copy's details and combining completion history and snooze dates when two tasks match), save the merged result locally, then push that merged result back up. Both sides end up holding the same superset after every cycle, so two devices that were each edited independently earlier in the day reconcile cleanly the next time either one syncs, without needing real per-field conflict resolution. If the network is unreachable or the sync call fails for any reason, the app falls back silently to the local copy; sync failures never block you from using the app, they just mean that device is temporarily out of date until the next successful sync.

### Setup

**Required assets:** a Google account with Drive access, and a few minutes in the Apps Script editor. No billing, no external service, nothing beyond what you already have.

**1. Create the Apps Script project.** Go to script.google.com and start a new project. Give it a name like "AppADay 060 Sync" so it's identifiable later.

**2. Paste in the backend code.** Delete whatever is in the default `Code.gs` file and replace it entirely with the contents of `AppsScript-Code.gs` from this repo folder.

**3. Create the storage file.** At the top of the pasted code you'll see two placeholder constants, `SYNC_FILE_ID` and `SYNC_PASSPHRASE`. Leave them alone for a moment. From the function dropdown at the top of the editor, select `createSyncFile` and click Run. The first run will prompt you to authorize the script; you'll see an "unverified app" warning since this is a personal script only you've created, that's expected, click Advanced, then click through to proceed. Once it runs, open the execution log (View menu, or Ctrl+Enter) and you'll see a line reading `File ID: ` followed by a long string. Copy that string.

**4. Set your constants.** Paste the file ID into `SYNC_FILE_ID` in place of the placeholder text. Then choose a passphrase of your own, something long and not reused anywhere else, and paste it into `SYNC_PASSPHRASE`. This passphrase is effectively the only thing standing between anyone who obtains your Web App URL and your task data, so treat it like a password rather than something incidentally guessable. Save the file.

**5. Deploy as a Web App.** Click Deploy, then New deployment. For "Select type," choose Web app. Set "Execute as" to Me, and "Who has access" to Anyone. Click Deploy, authorize again if prompted, and copy the Web App URL it gives you, it will look like `https://script.google.com/macros/s/AKfycb.../exec`.

**6. Connect the app.** Open the Task Manager, tap the gear icon in the header, paste the Web App URL and your passphrase into the two fields, and tap Test Connection. You should see a message confirming how many tasks it found on the server, zero the first time, which means the connection is working. Tap Save.

**7. Repeat step 6 on every other device.** Open the app on your phone, or any other browser you use it from, tap the gear icon, and enter the exact same URL and passphrase. All devices pointed at the same URL and passphrase are now syncing to the same file.

### Maintenance notes

If you ever edit the Apps Script code later, for example to rotate the passphrase, you need to create a new deployment version for the change to take effect on the existing URL: Deploy, Manage deployments, edit the existing one, and choose "New version" under Version before deploying again. Editing the code alone, without pushing a new version, leaves the live URL running the old code.

If you ever want to see the raw synced data directly, the `SYNC_FILE_ID` file lives in your Drive as a plain text file named `appaday-060-sync-data.json`; opening it shows exactly what every device is syncing against.

Turning sync off on a single device is a matter of opening Settings and clearing the URL field before saving; that device reverts to local-only storage without affecting any other device still pointed at the same sync URL.

### Identity, edits, and sync: uid, lastModified, and tombstones

Two related problems showed up once this got real multi-device use. First, deletions: a plain merge that only knows how to add things it's never seen before will, if one device deletes a task while another device is still holding a stale copy of it, treat that stale copy as something new to add back in on its next sync, and push it right back out to every other device. Second, and more subtly, edits: the merge originally decided whether two tasks were "the same task" by comparing their descriptive fields, task text, priority, location, minutes, and repeat rule. That's a reasonable definition right up until you edit one of those fields, at which point the edited copy stops matching its own older self, since the very thing used to recognize it just changed. Change a task's priority from A to `*` on one device, and a stale copy sitting on another device won't be recognized as the same task at all; either the edit gets silently dropped when a match does happen to hold, or the two copies drift into an outright duplicate.

Both problems come from the same root cause: nothing gave a task a stable identity that survives being edited. The fix adds two things. Every task now carries a `uid`, generated once when the task is created and never touched again regardless of what else about the task changes; merges match on `uid` first, and only fall back to comparing content when one side doesn't have a `uid` yet, which is what keeps this safe for tasks that existed before this upgrade shipped. Every task also carries a `lastModified` timestamp, bumped on every edit, which is what a merge actually needs to decide whose copy of the details is newer; the task's original `dateCreated` never changes on an edit, so it can't tell a change made five seconds ago from one that's been stale for a week, and using it for that comparison was part of what let a stale edit win over a fresh one.

Deletions still work the way tombstones described below always did, just checked by `uid` first, falling back to the same content signature for older tombstones or tasks that haven't converged onto a shared `uid` yet: deleting a task records a signature for it along with the deletion time, kept separately from the task list itself. Every merge, whether from cloud sync or a manual Import, unions incoming tombstones into the local set, removes any local task matching one, and skips re-adding any incoming task matching one, unless that incoming task's own `lastModified` postdates the tombstone, in which case it's treated as a genuinely new task that happens to look similar rather than the old one coming back. Tombstones are pruned after 60 days, long enough to cover a device that's been offline for a while without letting the sync file grow forever.

None of this requires anything from you. Tasks that predate this update don't have a `uid` or `lastModified` yet; the app backfills a `uid` for them the moment it loads, and the first sync after that will still recognize an unedited legacy task correctly through the content-match fallback, converging both devices onto the same `uid` in the process. From that point on, edits to that task are tracked properly. The only thing to know is that a task edited on two devices between syncs, rather than just being deleted or added, resolves by keeping whichever edit has the later `lastModified`, a straightforward last-edit-wins rule rather than a field-by-field merge, which is the right tradeoff for a personal list used sequentially rather than truly concurrently.

## Notes

Repeat-rule parsing, due-today logic, and the calendar export were carried over largely unchanged from the original Apps Script version. What changed is the data layer: instead of two Google Doc tables (a task table and a state table) reached through `google.script.run`, everything now lives in one flat array of task objects, each carrying its own completion history and snooze date, read and written directly through `window.localStorage`, with the optional cloud sync layer described above reaching the same shape of data out to a separate, personally-owned Apps Script Web App over `fetch()`.
