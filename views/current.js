async function fetchInfluxDBData() {
    const influxDBEndpoint = 'http://192.168.160.55:8086/query?db=homeassistant&u=admin&p=adminadmin';

    const queries = [
        `SELECT last("value") AS "solarProduction" FROM "state" WHERE "topic" = 'solar_assistant_DEYE/total/pv_power/state'`,
        `SELECT last("value") AS "batteryStateOfCharge" FROM "state" WHERE "topic" = 'solar_assistant_DEYE/total/battery_state_of_charge/state'`,
        `SELECT last("value") AS "gridPower" FROM "state" WHERE "topic" = 'solar_assistant_DEYE/total/grid_power/state'`,
        `SELECT last("value") AS "loadPower" FROM "state" WHERE "topic" = 'solar_assistant_DEYE/total/load_power/state'`,
        `SELECT last("value") AS "gridVoltage" FROM "state" WHERE "topic" = 'solar_assistant_DEYE/total/grid_voltage/state'`
    ];

    try {
        const responses = await Promise.all(queries.map(async query => {
            const response = await fetch(influxDBEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `q=${encodeURIComponent(query)}`
            });
            return await response.json();
        }));

        const data = responses.map(response => response.results[0].series[0].values[0][1]);

        return {
            solarProduction: data[0],
            batteryStateOfCharge: data[1],
            gridPower: data[2],
            loadPower: data[3],
            gridVoltage: data[4]
        };
    } catch (error) {
        console.error('Error fetching data from InfluxDB:', error);
        throw error;
    }
}

function updateRealTimeData() {
    fetchInfluxDBData()
        .then(data => {
            updateCircleProgress('.solar-production', { value: data.solarProduction }, '#06ccff');
            updateCircleProgress('.battery-state-of-charge', { value: data.batteryStateOfCharge }, '#ff00be');
            updateCircleProgress('.grid-import', { value: data.gridPower }, '#fee800');
            updateCircleProgress('.load-power', { value: data.loadPower }, '#00ffae');
            updateCircleProgress('.grid-voltage', { value: data.gridVoltage }, '#ffa500');
        })
        .catch(error => console.error('Error updating real-time data:', error));
}

function updateCircleProgress(selector, data, color) {
    const progressElement = document.querySelector(`${selector} .progress`);
    const valueElement = document.querySelector(`${selector} .value`);
    const iconElement = document.querySelector(`${selector} .icon`);

    let valueText = `${data.value.toFixed(2)} ${selector === '.grid-voltage' ? 'V' : 'W'}`;
    if (selector === '.battery-state-of-charge') {
        valueText = `${data.value.toFixed(2)} %`;
    }

    // Update the progress bar width and value
    progressElement.style.strokeDashoffset = 565.48 - (565.48 * (data.value / 1000));
    progressElement.style.stroke = color;
    iconElement.style.color = color;
    valueElement.textContent = valueText;
}

// Update the real-time data every 5 seconds
setInterval(updateRealTimeData, 5000);
