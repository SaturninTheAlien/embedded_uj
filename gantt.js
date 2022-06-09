function drawGanttChart(container, time_results) {
    let processors_tasks = [];

    for(let time_result of time_results.detailed_results) {
        let row = {
            x: time_result.proc_name,
            y: [
                time_result.start_time,
                time_result.end_time
            ]
        };

        processors_tasks.push({
            name: time_result.task_name,
            data: [row]
        });
    }

    var options = {
        series: processors_tasks,
        chart: {
            type: 'rangeBar'
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '100%'
            }
        },
        xaxis: {
            type: 'number'
        },
        stroke: {
            width: 1
        },
        dataLabels: {
            enabled: true,
            formatter: function(val, opts) {
                let label = opts.w.globals.seriesNames[opts.seriesIndex]
                let diff = val[1] - val[0];
                return `${label}: ${diff}`;
            }
        },
        fill: {
            type: 'solid',
            opacity: 0.6
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left'
        }
    };

    container.innerHTML = '';
    var chart = new ApexCharts(container, options);
    chart.render();
}