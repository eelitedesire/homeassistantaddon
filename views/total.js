async function fetchDataFromInfluxDB() {
    const influxDBEndpoint = 'http://192.168.160.55:8086/query?db=homeassistant&u=admin&p=adminadmin';
    const dailyQueries = [
        `SELECT mean("value") AS "loadPowerData"
            FROM "state"
            WHERE "topic" = 'solar_assistant_DEYE/total/load_energy/state'
            AND time >= now() - 30d
            GROUP BY time(1d)`,
        `SELECT mean("value") AS "pvPowerData"
            FROM "state"
            WHERE "topic" = 'solar_assistant_DEYE/total/pv_energy/state'
            AND time >= now() - 30d
            GROUP BY time(1d)`,
        `SELECT mean("value") AS "batteryStateOfChargeData"
            FROM "state"
            WHERE "topic" = 'solar_assistant_DEYE/total/battery_energy_in/state'
            AND time >= now() - 30d
            GROUP BY time(1d)`,
        `SELECT mean("value") AS "batteryPowerData"
            FROM "state"
            WHERE "topic" = 'solar_assistant_DEYE/total/battery_energy_out/state'
            AND time >= now() - 30d
            GROUP BY time(1d)`,
        `SELECT mean("value") AS "gridPowerData"
            FROM "state"
            WHERE "topic" = 'solar_assistant_DEYE/total/grid_energy_in/state'
            AND time >= now() - 30d
            GROUP BY time(1d)`,
        `SELECT mean("value") AS "gridVoltageData"
            FROM "state"
            WHERE "topic" = 'solar_assistant_DEYE/total/grid_energy_out/state'
            AND time >= now() - 30d
            GROUP BY time(1d)`
    ];

    try {
        const dailyResponses = await Promise.all(dailyQueries.map(query =>
            fetch(influxDBEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `q=${encodeURIComponent(query)}`
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                return response.json();
            })
        ));

        const dailyData = dailyResponses.map(response => response.results[0].series[0]);

        return {
            dailyData: {
                loadPowerData: dailyData[0].values,
                pvPowerData: dailyData[1].values,
                batteryStateOfChargeData: dailyData[2].values,
                batteryPowerData: dailyData[3].values,
                gridPowerData: dailyData[4].values,
                gridVoltageData: dailyData[5].values
            }
        };
    } catch (error) {
        console.error('Error fetching data from InfluxDB:', error);
        throw error;
    }
}


function calculateDailyDifference(data) {
return data.map((current, index, array) => {
if (index === 0 || array[index - 1][1] === null || array[index - 1][1] === 0) {
    return [current[0], 0]; // Set current day's data to zero if previous day's data was null or zero
} else {
    const previousData = array[index - 1][1];
    const currentData = current[1];
    if (currentData >= previousData) {
        return [current[0], currentData - previousData]; // Calculate difference if current data is greater than or equal to previous day's data
    } else {
        return [current[0], currentData]; // Keep current day's data unchanged if it's less than previous day's data
    }
}
});


}






function sumMonthlyData(dailyData) {
    const monthlyData = {};

    dailyData.forEach(([timestamp, value]) => {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // Months are zero-based
        const monthKey = `${year}-${month < 10 ? '0' : ''}${month}`;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }

        if (value !== null) {
            monthlyData[monthKey] += value;
        }
    });

    return monthlyData;
}

function formatNumber(value) {
    return value !== null ? value.toFixed(1) : '0';
}

function monthAbbreviation(monthNumber) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[monthNumber - 1];
}

async function displayData() {
    try {
        const data = await fetchDataFromInfluxDB();

        const dailyTableBody = document.querySelector('#daily-data-table tbody');
        const monthlyTableBody = document.querySelector('#monthly-data-table tbody');

        const loadPowerData = calculateDailyDifference(data.dailyData.loadPowerData, true);
        const pvPowerData = calculateDailyDifference(data.dailyData.pvPowerData, true);
        const batteryStateOfChargeData = calculateDailyDifference(data.dailyData.batteryStateOfChargeData, true);
        const batteryPowerData = calculateDailyDifference(data.dailyData.batteryPowerData, true);
        const gridPowerData = calculateDailyDifference(data.dailyData.gridPowerData, true);
        const gridVoltageData = calculateDailyDifference(data.dailyData.gridVoltageData, true);

        loadPowerData.forEach((row, index) => {
            const date = new Date(row[0]);
            const day = date.getDate();
            const month = date.getMonth() + 1; // Months are zero-based
            const year = date.getFullYear();

            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${day}/${monthAbbreviation(month)}/${year}</td>
                <td>${formatNumber(loadPowerData[index][1])} kWh</td>
                <td>${formatNumber(pvPowerData[index][1])} kWh</td>
                <td>${formatNumber(batteryStateOfChargeData[index][1])} kWh</td>
                <td>${formatNumber(batteryPowerData[index][1])} kWh</td>
                <td>${formatNumber(gridPowerData[index][1])} kWh</td>
                <td>${formatNumber(gridVoltageData[index][1])} kWh</td>
            `;
            dailyTableBody.insertBefore(newRow, dailyTableBody.firstChild);
        });

        document.getElementById('daily-loading').style.display = 'none';
        document.getElementById('daily-data-table').style.display = '';

        const summedMonthlyData = {
            loadPowerData: sumMonthlyData(loadPowerData),
            pvPowerData: sumMonthlyData(pvPowerData),
            batteryStateOfChargeData: sumMonthlyData(batteryStateOfChargeData),
            batteryPowerData: sumMonthlyData(batteryPowerData),
            gridPowerData: sumMonthlyData(gridPowerData),
            gridVoltageData: sumMonthlyData(gridVoltageData)
        };

        const months = Object.keys(summedMonthlyData.loadPowerData).reverse();
        months.forEach(month => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${monthAbbreviation(parseInt(month.split("-")[1]))}</td>
                <td>${formatNumber(summedMonthlyData.loadPowerData[month])} kWh</td>
                <td>${formatNumber(summedMonthlyData.pvPowerData[month])} kWh</td>
                <td>${formatNumber(summedMonthlyData.batteryStateOfChargeData[month])} kWh</td>
                <td>${formatNumber(summedMonthlyData.batteryPowerData[month])} kWh</td>
                <td>${formatNumber(summedMonthlyData.gridPowerData[month])} kWh</td>
                <td>${formatNumber(summedMonthlyData.gridVoltageData[month])} kWh</td>
            `;
            monthlyTableBody.appendChild(newRow); 
        });

        document.getElementById('monthly-loading').style.display = 'none';
        document.getElementById('monthly-data-table').style.display = '';

        const dailyTotal = pvPowerData.reduce((sum, row) => sum + (row[1] || 0), 0);
        const weeklyTotal = pvPowerData.slice(-7).reduce((sum, row) => sum + (row[1] || 0), 0);
        const monthlyTotal = Object.values(summedMonthlyData.pvPowerData).reduce((sum, value) => sum + value, 0);

        document.getElementById('daily-total').textContent = `${formatNumber(dailyTotal)} kWh`;
        document.getElementById('weekly-total').textContent = `${formatNumber(weeklyTotal)} kWh`;
        document.getElementById('monthly-total').textContent = `${formatNumber(monthlyTotal)} kWh`;
    } catch (error) {
        console.error('Error displaying data:', error);
    }
}

function exportToCSV() {
    const dailyTable = document.getElementById('daily-data-table');
    const monthlyTable = document.getElementById('monthly-data-table');

    let csvContent = '';

    const dailyHeaders = Array.from(dailyTable.querySelectorAll('thead th'))
        .map(header => header.textContent)
        .join(',');

    const dailyRows = Array.from(dailyTable.querySelectorAll('tbody tr'))
        .map(row => Array.from(row.querySelectorAll('td'))
        .map(cell => cell.textContent)
        .join(','));

    csvContent += 'Daily Data\n';
    csvContent += dailyHeaders + '\n';
    csvContent += dailyRows.join('\n') + '\n\n';

    const monthlyHeaders = Array.from(monthlyTable.querySelectorAll('thead th'))
        .map(header => header.textContent)
        .join(',');

    const monthlyRows = Array.from(monthlyTable.querySelectorAll('tbody tr'))
        .map(row => Array.from(row.querySelectorAll('td'))
        .map(cell => cell.textContent)
        .join(','));

    csvContent += 'Monthly Data\n';
    csvContent += monthlyHeaders + '\n';
    csvContent += monthlyRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Call the displayData function to populate the tables
displayData();