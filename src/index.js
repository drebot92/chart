const app = document.getElementById('app');
const chart = new Chart(app, {
  data: chartsData[0],
  previewHeight: 600,
});
const chart2 = new Chart(app, {
  data: chartsData[1],
  previewHeight: 600,
});
// const chart2 = new Chart({
//   data: chartsData[1],
// });

console.log(chart, chart2);


// app.appendChild(chart);
// app.appendChild(chart2);
console.timeEnd();
