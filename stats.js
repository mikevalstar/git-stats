// runs in browser

var ctx = document.getElementById('chart').getContext('2d');
var ctxMatrix = document.getElementById('matrix').getContext('2d');

let data = null;
let chart = null;
let matrixData = null;
let matrixChart = null;

async function setData(incoming) {
  data = await incoming.json();
}

async function setMatrixData(incoming) {
  matrixData = await incoming.json();
}

function dataSetParse() {
  const selectedItems = document.querySelectorAll(
    '#chart-options input:checked'
  );

  let dataSet = {};
  if (selectedItems.length > 0) {
    for (const si of selectedItems) {
      // combine with existing data
      for (const ds in data[si.value]) {
        if (!dataSet[ds]) {
          dataSet[ds] = data[si.value][ds];
        } else {
          dataSet[ds] = dataSet[ds].map((v, i) => v + data[si.value][ds][i]);
        }
      }
    }
  } else {
    dataSet = data.dataCode;
  }

  return dataSet;
}

async function updateChart() {
  const dataSet = dataSetParse();

  // update chart data
  for (const line in dataSet) {
    if (line == 'Total') continue;

    //find
    const found = chart.data.datasets.find((ds) => ds.label == line);
    if (found) {
      found.data = dataSet[line];
      continue;
    }

    chart.data.datasets.push({
      label: line,
      //backgroundColor: data.lines[line].color,
      //borderColor: data.lines[line].color,
      data: dataSet[line],
      fill: true,
    });
  }

  chart.update();
}

async function renderChart() {
  // Line data
  const lineData = {
    labels: data.dates,
    datasets: [],
  };

  const dataSet = dataSetParse();

  for (const line in dataSet) {
    if (line == 'Total') continue;
    lineData.datasets.push({
      label: line,
      //backgroundColor: data.lines[line].color,
      //borderColor: data.lines[line].color,
      data: dataSet[line],
      fill: true,
    });
  }

  // Chartjs stacked area chart
  const config = {
    type: 'line',
    data: lineData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: () => 'Chart.js Stacked Chart',
        },
        tooltip: {
          mode: 'index',
          callbacks: {
            title: function (context) {
              const dt = dayjs(context[0].parsed.x).format('DD MMM, YYYY');
              return `${dt} - Lines of Code`;
            },
          },
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
          },
          ticks: {
            callback: (val) => {
              return dayjs(val).format('DD MMM, YYYY');
            },
          },
          title: {
            display: true,
            text: 'Date',
          },
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: 'Value',
          },
        },
      },
    },
  };

  chart = new Chart(ctx, config);
}

async function renderMatrix() {
  const config = {
    type: 'matrix',
    data: {
      labels: matrixData.dates,
      datasets: [
        {
          label: 'Commit Matrix',
          data: matrixData.data,
          backgroundColor(context) {
            const value = context.dataset.data[context.dataIndex].v;
            const alpha = (value + 2) / 40;
            return Chart.helpers.color('green').alpha(alpha).rgbString();
          },
          borderColor(context) {
            const value = context.dataset.data[context.dataIndex].v;
            const alpha = (value + 2) / 40;
            return Chart.helpers.color('darkgreen').alpha(alpha).rgbString();
          },
          borderWidth: 1,
          width: ({ chart }) =>
            (chart.chartArea || {}).width / chart.scales.x.ticks.length - 1,
          height: ({ chart }) => (chart.chartArea || {}).height / 7 - 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: false,
        tooltip: {
          callbacks: {
            title() {
              return '';
            },
            label(context) {
              const v = context.dataset.data[context.dataIndex];
              return ['Commits: ' + v.v];
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            stepSize: 1,
            callback: (val, x, z) => {
              console.log(val, x, z);
              return dayjs(matrixData.dates[x]).format('MMM DD');
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          offset: true,
          ticks: {
            stepSize: 1,
            callback: (val, x, z) => {
              return dayjs().day(x).format('ddd');
            },
          },
          grid: {
            display: false,
          },
        },
      },
    },
  };

  chart = new Chart(ctxMatrix, config);
}

// wait for page to finish render
document.addEventListener('DOMContentLoaded', () => {
  // fetch dist/results.json
  fetch('results.json').then(setData).then(renderChart);
  fetch('commits.json').then(setMatrixData).then(renderMatrix);

  const options = document.querySelectorAll('#chart-options input');
  options.forEach((option) => {
    option.addEventListener('change', (e) => {
      updateChart();
    });
  });
});
