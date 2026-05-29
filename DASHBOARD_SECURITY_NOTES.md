# Dashboard — Security & Injection Notes

Notes on safe handling of user-entered data flowing from the Golf PWA → Google Sheets → future Analytics Dashboard.

---

## Context

The Golf app collects user input (player names, scores) on a public-facing page. Those values get posted to a Google Sheet. The future Dashboard module will read that sheet back and render it as HTML/charts.

That makes the Dashboard a downstream consumer of *untrusted user input*. Every piece of data coming back from the sheet should be treated as if a stranger could have written it — because, technically, that's true the moment the app is public.

---

## Findings from the Apr 24, 2026 audit of `Golf/index.html`

### Real risk — XSS in scorecard tables (lines ~961, ~1005)

Both `buildSection` paths build their scorecard HTML by string-concatenating player names into a template:

```js
html+=`<tr class="${rowCls}"><td>${name||'P'+(pi+1)}</td>`;
```

`name` is the raw player name. It's then assigned with `table.innerHTML=html`. If a player name contained HTML/JS — e.g. `<img src=x onerror=alert(1)>` — it would execute when the table renders.

**Mitigation today:** the player-input field has `maxlength="6"`, which makes a working payload very hard to fit. So the risk is theoretical for now, but the *pattern* is wrong and shouldn't be carried forward.

**Fix when convenient:** escape `name` before inserting, or use `textContent` for the cell instead of `innerHTML` for the row. A small helper:

```js
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
```

Then `${esc(name)}` everywhere a name lands inside an HTML string.

### Partial — player input row (line ~761)

`renderPlayers()` already does `name.replace(/"/g,'&quot;')` before placing the name into `value="${name}"`. That's defensive-enough for a value attribute, but the helper above would be cleaner and consistent.

### Safe — player chips (line ~825)

`chip.textContent = name || 'P' + (i+1)` — this is the right pattern. textContent never executes HTML. Use this elsewhere when possible.

---

## Rules for the Dashboard module (when we build it)

When the analytics module reads names/notes from the Google Sheet:

1. **Never** drop sheet values into the DOM via `innerHTML` / template literals concatenated into HTML. Use `textContent`, or run the value through an escape helper first.
2. **Treat every cell as untrusted**, even if you wrote it yourself. A future-you typing into Sheets is no different from a stranger typing into the app.
3. **Numbers should be coerced** with `Number(x)` before any math or rendering — guards against non-numeric junk.
4. **If the dashboard ever asks an LLM to summarize the sheet,** be aware: a malicious string in a cell could try to manipulate the model (prompt injection). Mitigation: prompt the model to treat sheet content as data only, and to flag any instruction-shaped content rather than follow it.

## Privacy reminder

The repo is public on github.com. **No secrets** belong in client code: no API keys, no service-account credentials, no auth tokens. Anything that needs a key (e.g. a server-side Google Sheets write) lives in an Apps Script web app or a backend, not in `index.html`.

---

*Last updated: Apr 24, 2026 — Claude scan of index.html v9-ish.*
