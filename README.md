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

## The snippet

```js
const grid = LatticeGrid.createGrid(document.getElementById('grid'), {
  rowKey: 'id',
  columns: [
    { field: 'id', title: 'SKU' },
    { field: 'item', title: 'Item' },
    {
      field: 'quantity', title: 'Quantity', type: 'number',
      edit: { enabled: true },
      validation: { required: true, min: 0, max: 500 },
    },
    {
      field: 'owner', title: 'Owner',
      edit: { enabled: true },
      validation: { required: true },
    },
  ],
  rows, // twelve stock items
});

grid.on('cell:edit:end', (e) => {
  if (e.writes.length) console.log('accepted:', e.writes[0]);
});
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
