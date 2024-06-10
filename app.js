const express = require('express');
const app = express();

// Define your data object
const data = {
    loadPowerData: {/* Your load power data */},
    pvPowerData: {/* Your PV power data */},
    batteryStateOfChargeData: {/* Your battery state of charge data */},
    batteryPowerData: {/* Your battery power data */},
    gridPowerData: {/* Your grid power data */},
    gridVoltageData: {/* Your grid voltage data */},
    solarPvTotalDaily: {/* Your solar PV total daily data */},
    solarPvTotalWeekly: {/* Your solar PV total weekly data */},
    solarPvTotalMonthly: {/* Your solar PV total monthly data */},
    gridVoltage: {/* Your grid voltage data */}
};

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Define a route to render the 'analytics' template and pass the data object
app.get('/', (req, res) => {
    res.render('main', { data });
});

app.get('/total', (req, res) => {
    res.render('total', { data });
});



// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
