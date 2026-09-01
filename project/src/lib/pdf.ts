import { Category } from '../types';

export function exportToPDF(categories: Category[]) {
  const rows = categories
    .map(
      (cat) => `
      <h2 class="category-title">${cat.name.toUpperCase()}</h2>
      <div class="grid-table">
        ${cat.words
          .map(
            (w) => `
          <div class="row">
            <span class="cell-word">${w.word}</span>
            <span class="cell-clue">${w.clue}</span>
          </div>`
          )
          .join('')}
      </div>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Impostor — Paquete de Palabras</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; padding: 30px; color: #111; }
    h1 { text-align: center; color: #130624; margin-bottom: 10px; }
    .subtitle { text-align: center; color: #555; margin-bottom: 30px; font-size: 13px; }
    .category-title { text-transform: uppercase; font-size: 18px; color: #130624; border-bottom: 2px solid #4ADE80; margin-top: 25px; padding-bottom: 5px; }
    .grid-table { display: table; width: 100%; margin-top: 10px; }
    .row { display: table-row; }
    .cell-word { display: table-cell; font-weight: bold; padding: 6px 0; width: 50%; }
    .cell-clue { display: table-cell; color: #555; font-style: italic; padding: 6px 0; width: 50%; }
    @media print { body { padding: 15px; } }
  </style>
</head>
<body>
  <h1>IMPOSTOR</h1>
  <p class="subtitle">Paquete de Palabras y Pistas</p>
  ${rows}
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
