// runs in browser

var ctx = document.getElementById('chart').getContext('2d');

async function renderChart(data) {
  // json data
  var data = await data.json();

  // Line data
  const lineData = {
    labels: data.dates,
    datasets: [],
  };

  for (const line in data.dataCode) {
    if (line == 'Total') continue;
    lineData.datasets.push({
      label: line,
      //backgroundColor: data.lines[line].color,
      //borderColor: data.lines[line].color,
      data: data.dataCode[line],
      fill: true,
    });
  }

  // Chartjs stacked area chart
  const config = {
    type: 'line',
    data: lineData,
    options: {
      responsive: true,
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

  var chart = new Chart(ctx, config);
}

// fetch dist/results.json
fetch('results.json').then(renderChart);
