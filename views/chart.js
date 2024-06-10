
window.onload = async function () {
    const influxDBEndpoint = 'http://192.168.160.55:8086/query?db=homeassistant&u=admin&p=adminadmin';

    async function fetchData(query) {
        const response = await fetch(influxDBEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `q=${encodeURIComponent(query)}`
        });
        const jsonResponse = await response.json();
        if (jsonResponse.results && jsonResponse.results[0] && jsonResponse.results[0].series && jsonResponse.results[0].series[0]) {
            return jsonResponse.results[0].series[0].values;
        }
        return [];
    }

    async function renderChart(containerId, title, yAxisTitle, queries) {
        try {
            const datasets = await Promise.all(queries.map(fetchData));

            const labels = datasets[0].map(row => new Date(row[0]));

            const chart = new CanvasJS.Chart(containerId, {
                animationEnabled: true,
                title: {
                    text: title
                },
                axisY: {
                    includeZero: true,
                    title: yAxisTitle
                },
                axisX: {
                    title: "Time"
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    fontSize: 13
                },
                data: datasets.map((data, index) => ({
                    type: "splineArea",
                    showInLegend: true,
                    name: ["Load Power", "Grid Power", "PV Power", "Battery State of Charge"][index],
                    yValueFormatString: "#,##0 kW",
                    xValueFormatString: "MMM DD",
                    dataPoints: data.map((row, rowIndex) => ({
                        x: labels[rowIndex],
                        y: row[1]
                    }))
                }))
            });

            chart.render();
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    // Render the first chart
    renderChart("chartContainer1", "Last 52 weeks", "Power (kW)", [
        `SELECT MEAN("value") AS "Power" FROM "state" WHERE time > now() - 52w AND "topic" = 'solar_assistant_DEYE/total/load_power/state' GROUP BY time(1w)`,
        `SELECT MEAN("value") AS "Power" FROM "state" WHERE time > now() - 52w AND "topic" = 'solar_assistant_DEYE/total/grid_power/state' GROUP BY time(1w)`,
        `SELECT MEAN("value") AS "Power" FROM "state" WHERE time > now() - 52w AND "topic" = 'solar_assistant_DEYE/total/pv_power/state' GROUP BY time(1w)`
    ]);

    // Render the second chart
    renderChart("chartContainer2", "Last 30 days", "Power (kW)", [
        `SELECT MEAN("value") AS "Power" FROM "state" WHERE time > now() - 30d AND "topic" = 'solar_assistant_DEYE/total/load_power/state' GROUP BY time(1d)`,
        `SELECT MEAN("value") AS "Power" FROM "state" WHERE time > now() - 30d AND "topic" = 'solar_assistant_DEYE/total/grid_power/state' GROUP BY time(1d)`,
        `SELECT MEAN("value") AS "Power" FROM "state" WHERE time > now() - 30d AND "topic" = 'solar_assistant_DEYE/total/pv_power/state' GROUP BY time(1d)`
    ]);

    // Render the third chart (Battery State of Charge)
    renderChart("chartContainer3", "Battery State of Charge", "State of Charge (%)", [
        `SELECT MEAN("value") AS "Battery State of Charge" FROM "state" WHERE time > now() - 1d AND "topic" = 'solar_assistant_DEYE/battery_1/state_of_charge/state' GROUP BY time(1d)`
    ]);
}
