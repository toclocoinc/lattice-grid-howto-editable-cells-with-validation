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
