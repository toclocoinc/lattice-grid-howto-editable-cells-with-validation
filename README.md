# How to make grid cells editable, with validation

Edits two columns of a twelve-row stock table in place: Quantity, which declares
`min: 0, max: 500`, and Owner, which declares `required: true`. Declare
`edit: { enabled: true }` and a `validation` rule on a column and the grid does the
rest: double-click or Enter opens the cell, a value that fails its rule is vetoed
before it is written, the cell keeps its old value and is marked invalid, and a
corrected value clears the mark. Accepted edits are logged in a small list below
the grid.

Live demo: https://toclocoinc.github.io/lattice-grid-howto-editable-cells-with-validation/

**Read the how-to:** https://www.latticegrid.dev/docs/how-to/editable-cells-with-validation/

## The full source

Two files: `index.html` loads the grid and declares the mount point, `demo.js` configures and creates it. Copy both as they are below and it runs.

### index.html

```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>How to make grid cells editable, with validation</title>
    <meta
      name="description"
      content="Edit two columns in place in the same JavaScript data grid: a quantity with a range rule and an owner that cannot be blank. A refused edit is vetoed before it lands and marked invalid; accepted edits are logged below. Built with Lattice Grid loaded by script tag, no install and no build."
    />
    <link rel="icon" href="data:," />
    <!--
      The grid's stylesheet, from jsDelivr. The address names the exact
      release, 1.68.2, and carries the hash of the file it expects, so the
      page can never quietly pick up a different build than the one it was
      checked against.
    -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/lattice-grid.min.css"
      integrity="sha384-mcpd7S8C5nz58bZDAXdYH6rzezEhfN7B4u2SlW426dSe20GnkxTu4TygyOILnCth"
      crossorigin="anonymous"
    />
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #f4f6f9; color: #131a24; }
      header { padding: 1.5rem 1.5rem 0.5rem; max-width: 960px; margin: 0 auto; }
      header p { color: #4a5568; }
      header a { color: #2d6bff; }
      main { max-width: 960px; margin: 0 auto; padding: 0 1.5rem 2.5rem; }
      #grid { height: 420px; }
      #stat { font-size: 0.9rem; color: #4a5568; margin: 0 0 0.75rem; }
      #log-panel { margin-top: 1.5rem; }
      #log-panel h2 { font-size: 1rem; margin: 0 0 0.5rem; }
      #log { list-style: none; margin: 0; padding: 0; font-size: 0.9rem; }
      #log li { padding: 0.35rem 0; border-top: 1px solid #e2e6ec; }
      #log:empty::before { content: 'No edits accepted yet.'; color: #8c97a6; }
    </style>
  </head>
  <body>
    <header>
      <h1>How to make grid cells editable, with validation</h1>
      <p>
        Twelve stock items below have two editable columns: Quantity, which must stay between
        0 and 500, and Owner, which cannot be blank. Double-click a cell, or focus it and press
        Enter, to edit it. A value that breaks its rule is refused, the old value stays and the
        cell is marked invalid; an accepted edit is logged beneath the grid. Read the
        <a href="https://www.latticegrid.dev/docs/how-to/editable-cells-with-validation/">full how-to</a>
        on latticegrid.dev.
      </p>
    </header>
    <main>
      <p id="stat"></p>
      <div id="grid"></div>
      <div id="log-panel">
        <h2>Accepted edits</h2>
        <ul id="log"></ul>
      </div>
    </main>

    <!--
      The library, as a classic script tag. No npm install, no bundler, no
      type="module": the file runs as it arrives and leaves the LatticeGrid
      global behind.
    -->
    <script
      src="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/lattice-grid.min.js"
      integrity="sha384-vCzLyFYn0T0lz/vkdH4x0JpJZkOazZgI2LiGui7lm5uerdZd0Z46G9hr3Aq1FFPS"
      crossorigin="anonymous"
    ></script>
    <script src="./demo.js"></script>
  </body>
</html>
```

### demo.js

```js
/**
 * Make two columns editable, and give each one a rule for what a good value
 * looks like.
 *
 * `edit: { enabled: true }` on a column turns its cells into inputs on
 * double-click or Enter. `validation` on the same column states the rule as
 * data: `min`/`max` for the quantity, `required` for the owner. A value that
 * fails its rule is vetoed before it is written, the cell keeps its old
 * value and the grid marks it invalid; nothing here wires that, it is the
 * grid's own behaviour. `cell:edit:end` fires after every attempt, so
 * listening for one with `writes` is how a page notices an edit actually
 * landed.
 */

// Tied to toclocoinc.github.io only; has no effect anywhere else and needs
// no key at all to run this page from a local copy.
LatticeGrid.setLicence(
  'LG1.eyJ2IjoxLCJwIjoibGF0dGljZS1ncmlkIiwidCI6IlRPQ0xPQ08gSW5jIC0gcHVibGljIGRlbW9zIiwiZSI6IjIwMzAtMDEtMDEiLCJkIjpbInRvY2xvY29pbmMuZ2l0aHViLmlvIl19.9De42ua3aCGpiMB6EVRP7Tv-upUlDI-0T07rlSPzvCrsqg8t4YJi7SRnStEpAg48uzmcG7il1fR_TfwkUE7iCA'
);

const ITEMS = [
  { id: 'SKU-01', item: 'Steel bolts (M6)', quantity: 240, owner: 'Priya Shah' },
  { id: 'SKU-02', item: 'Steel bolts (M8)', quantity: 180, owner: 'Priya Shah' },
  { id: 'SKU-03', item: 'Rubber gaskets', quantity: 95, owner: 'Callum Reid' },
  { id: 'SKU-04', item: 'Copper wire (10m)', quantity: 60, owner: 'Callum Reid' },
  { id: 'SKU-05', item: 'Ball bearings', quantity: 310, owner: 'Aisha Bello' },
  { id: 'SKU-06', item: 'Hex nuts (M6)', quantity: 420, owner: 'Aisha Bello' },
  { id: 'SKU-07', item: 'Washers (flat)', quantity: 150, owner: 'Tom Fenwick' },
  { id: 'SKU-08', item: 'Cable ties', quantity: 275, owner: 'Tom Fenwick' },
  { id: 'SKU-09', item: 'Sealant tubes', quantity: 40, owner: 'Diego Marín' },
  { id: 'SKU-10', item: 'Grease cartridges', quantity: 85, owner: 'Diego Marín' },
  { id: 'SKU-11', item: 'Filter cartridges', quantity: 130, owner: 'Wren Ashby' },
  { id: 'SKU-12', item: 'Pressure gauges', quantity: 22, owner: 'Wren Ashby' },
];

const grid = LatticeGrid.createGrid(document.getElementById('grid'), {
  rowKey: 'id',
  columns: [
    { field: 'id', title: 'SKU', layout: { width: 90 } },
    { field: 'item', title: 'Item', layout: { flex: 1, min: 170 } },
    {
      field: 'quantity', title: 'Quantity', type: 'number',
      edit: { enabled: true },
      validation: {
        required: true, min: 0, max: 500,
        messages: { min: 'Quantity cannot be negative.', max: '500 at most in stock.' },
      },
      layout: { width: 110 },
    },
    {
      field: 'owner', title: 'Owner',
      edit: { enabled: true },
      validation: { required: true, messages: { required: 'An owner is required.' } },
      layout: { width: 150 },
    },
  ],
  rows: ITEMS,
});
window.__demoGrid = grid; // read by tools/verify.mjs

const log = document.getElementById('log');
grid.on('cell:edit:end', (e) => {
  if (!e.writes || !e.writes.length) return; // refused, cancelled, or nothing changed
  const write = e.writes[0];
  if (Object.is(write.before, write.after)) return; // committed but no actual change (e.g. Enter's own move to the next row)
  const li = document.createElement('li');
  li.textContent = `${e.key} ${write.colId}: ${write.before ?? '(blank)'} → ${write.after}`;
  log.prepend(li);
});

document.getElementById('stat').textContent =
  `${ITEMS.length} stock items; Quantity (0-500) and Owner (required) are editable`;
```

Validation is declared as data on the column, not written as a function: `required`,
`min`/`max`, `minLength`/`maxLength`, a `pattern`, a `oneOf` list and a `crossField`
predicate are all available. A failing edit never reaches the row; only a person's
own keystroke is gated, so a value your own code writes or one arriving from a feed
still lands untouched.

## Running it yourself

Open `index.html` in a browser, or serve the folder with any static file server.
The grid loads from jsDelivr by script tag, so there is no install and no build
step. It runs keyless on `localhost`; the licence key in `demo.js` is bound to
`toclocoinc.github.io` and has no effect anywhere else.

## Licence

MIT, see [LICENSE](./LICENSE). Lattice Grid itself is licensed separately
per domain: https://www.latticegrid.dev/pricing/
