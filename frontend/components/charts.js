/**
 * charts.js — Wrapper Chart.js untuk grafik keuangan BudgetSheet
 */

/**
 * Menghancurkan chart yang ada pada canvas sebelum membuat yang baru.
 * @param {string} canvasId
 */
function _destroyExistingChart(canvasId) {
  if (typeof Chart !== 'undefined' && Chart.getChart) {
    var existing = Chart.getChart(canvasId);
    if (existing) existing.destroy();
  }
}

/**
 * Membuat doughnut chart.
 * @param {string} canvasId
 * @param {string[]} labels
 * @param {number[]} data
 * @param {string[]} colors
 * @returns {Chart|null}
 */
function renderPieChart(canvasId, labels, data, colors) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  _destroyExistingChart(canvasId);

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors || labels.map(function(_, i) {
          var palette = ['#A8D8EA','#C9B8E8','#B8E8D4','#FFD166','#EF6C6C','#74B9FF','#6BCB77','#F9A8D4'];
          return palette[i % palette.length];
        }),
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.6)',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 12, font: { size: 12 }, color: '#333' },
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              var val = ctx.parsed;
              var total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0);
              var pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ' ' + ctx.label + ': ' + formatCurrency(val) + ' (' + pct + '%)';
            },
          },
        },
      },
    },
  });
}

/**
 * Membuat line chart dengan kurva halus.
 * @param {string} canvasId
 * @param {string[]} labels
 * @param {Array<{label: string, data: number[], borderColor?: string, backgroundColor?: string}>} datasets
 * @returns {Chart|null}
 */
function renderLineChart(canvasId, labels, datasets) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  _destroyExistingChart(canvasId);

  var defaultColors = ['#A8D8EA','#C9B8E8','#6BCB77','#FFD166','#EF6C6C'];

  var chartDatasets = datasets.map(function(ds, i) {
    var color = ds.borderColor || defaultColors[i % defaultColors.length];
    return {
      label: ds.label,
      data: ds.data,
      borderColor: color,
      backgroundColor: ds.backgroundColor || color.replace(')', ', 0.15)').replace('rgb', 'rgba'),
      borderWidth: 2,
      pointBackgroundColor: color,
      pointRadius: 4,
      fill: true,
      tension: 0.4,
    };
  });

  return new Chart(canvas, {
    type: 'line',
    data: { labels: labels, datasets: chartDatasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 12 }, color: '#333' } },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ' ' + ctx.dataset.label + ': ' + formatCurrency(ctx.parsed.y);
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(val) { return formatCurrency(val); },
            color: '#555',
          },
          grid: { color: 'rgba(255,255,255,0.3)' },
        },
        x: {
          ticks: { color: '#555' },
          grid: { color: 'rgba(255,255,255,0.3)' },
        },
      },
    },
  });
}

/**
 * Membuat bar chart.
 * @param {string} canvasId
 * @param {string[]} labels
 * @param {Array<{label: string, data: number[], backgroundColor?: string, borderColor?: string}>} datasets
 * @returns {Chart|null}
 */
function renderBarChart(canvasId, labels, datasets) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  _destroyExistingChart(canvasId);

  var defaultBg = ['rgba(168,216,234,0.8)','rgba(201,184,232,0.8)','rgba(107,203,119,0.8)','rgba(255,209,102,0.8)'];
  var defaultBorder = ['#A8D8EA','#C9B8E8','#6BCB77','#FFD166'];

  var chartDatasets = datasets.map(function(ds, i) {
    return {
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.backgroundColor || defaultBg[i % defaultBg.length],
      borderColor: ds.borderColor || defaultBorder[i % defaultBorder.length],
      borderWidth: 1,
      borderRadius: 6,
    };
  });

  return new Chart(canvas, {
    type: 'bar',
    data: { labels: labels, datasets: chartDatasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 12 }, color: '#333' } },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ' ' + ctx.dataset.label + ': ' + formatCurrency(ctx.parsed.y);
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(val) { return formatCurrency(val); },
            color: '#555',
          },
          grid: { color: 'rgba(255,255,255,0.3)' },
        },
        x: {
          ticks: { color: '#555' },
          grid: { color: 'rgba(255,255,255,0.3)' },
        },
      },
    },
  });
}

if (typeof module !== 'undefined') {
  module.exports = { renderPieChart, renderLineChart, renderBarChart, _destroyExistingChart };
}
