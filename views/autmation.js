
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
let automationSettings = {};

function loadAutomationSettings(brand) {
  const automationSettingsTable = document.getElementById('automationSettings');
  const addRowButton = document.querySelector('#automationSettingsForm button');

  // Clear existing automation settings
  while (automationSettingsTable.rows.length > 1) {
    automationSettingsTable.deleteRow(1);
  }

  if (brand) {
    automationSettings = JSON.parse(localStorage.getItem(`automationSettings_${brand}`)) || {};
    addRowButton.disabled = false;

    // Load automation settings from localStorage
    for (const day in automationSettings) {
      for (const hour in automationSettings[day]) {
        const settings = automationSettings[day][hour];
        addRow(day, hour, settings);
      }
    }
  } else {
    automationSettings = {};
    addRowButton.disabled = true;
  }
}

function addRow(day, hour, settings) {
  const table = document.getElementById('automationSettings');
  const row = table.insertRow(-1);
  const dayCell = row.insertCell(0);
  const startHourCell = row.insertCell(1);
  const endHourCell = row.insertCell(2);
  const maxBatteryDischargePowerCell = row.insertCell(3);
  const gridChargeEnabledCell = row.insertCell(4);
  const generatorChargeEnabledCell = row.insertCell(5);
  const dischargeVoltageCell = row.insertCell(6);
  const actionsCell = row.insertCell(7);

  dayCell.innerHTML = `<select>${daysOfWeek.map((dayName, index) => `<option value="${index}" ${index === day ? 'selected' : ''}>${dayName}</option>`).join('')}</select>`;
  startHourCell.innerHTML = `<input type="number" min="0" max="23" placeholder="Start Hour" value="${hour !== undefined ? hour : ''}">`;
  endHourCell.innerHTML = `<input type="number" min="0" max="23" placeholder="End Hour" value="${hour !== undefined ? hour : ''}">`;
  maxBatteryDischargePowerCell.innerHTML = `<input type="text" placeholder="Max Battery Discharge Power" value="${settings ? settings.maxBatteryDischargePower : ''}">`;
  gridChargeEnabledCell.innerHTML = `<select>
    <option value="">Grid Charge Enabled</option>
    <option value="true" ${settings && settings.gridChargeEnabled === true ? 'selected' : ''}>True</option>
    <option value="false" ${settings && settings.gridChargeEnabled === false ? 'selected' : ''}>False</option>
  </select>`;
  generatorChargeEnabledCell.innerHTML = `<select>
    <option value="">Generator Charge Enabled</option>
    <option value="true" ${settings && settings.generatorChargeEnabled === true ? 'selected' : ''}>True</option>
    <option value="false" ${settings && settings.generatorChargeEnabled === false ? 'selected' : ''}>False</option>
  </select>`;
  dischargeVoltageCell.innerHTML = `<input type="text" placeholder="Discharge Voltage" value="${settings ? settings.dischargeVoltage : ''}">`;
  actionsCell.innerHTML = `
    <button class="btn" onclick="saveSettings(this)">Save</button>
    <button class="btn" onclick="deleteRow(this)">Delete</button>
  `;
}

function saveSettings(button) {
  const row = button.parentNode.parentNode;
  const day = parseInt(row.cells[0].querySelector('select').value);
  const startHour = parseInt(row.cells[1].querySelector('input').value);
  const endHour = parseInt(row.cells[2].querySelector('input').value);
  const maxBatteryDischargePower = row.cells[3].querySelector('input').value;
  const gridChargeEnabled = row.cells[4].querySelector('select').value;
  const generatorChargeEnabled = row.cells[5].querySelector('select').value;
  const dischargeVoltage = row.cells[6].querySelector('input').value;

  if (startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23 && startHour <= endHour && maxBatteryDischargePower !== '' && gridChargeEnabled !== '' && generatorChargeEnabled !== '' && dischargeVoltage !== '') {
    const brand = document.getElementById('inverterBrand').value;
    if (!automationSettings[brand]) {
      automationSettings[brand] = {};
    }
    if (!automationSettings[brand][day]) {
      automationSettings[brand][day] = {};
    }

    for (let hour = startHour; hour <= endHour; hour++) {
      automationSettings[brand][day][hour] = {
        maxBatteryDischargePower,
        gridChargeEnabled: gridChargeEnabled === 'true',
        generatorChargeEnabled: generatorChargeEnabled === 'true',
        dischargeVoltage
      };
    }

    localStorage.setItem(`automationSettings_${brand}`, JSON.stringify(automationSettings[brand]));
    alert('Automation settings updated successfully');
  } else {
    alert('Please fill in all fields correctly');
  }
}

function deleteRow(button) {
  const row = button.parentNode.parentNode;
  const day = parseInt(row.cells[0].querySelector('select').value);
  const startHour = parseInt(row.cells[1].querySelector('input').value);
  const endHour = parseInt(row.cells[2].querySelector('input').value);

  if (startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23 && startHour <= endHour) {
    const brand = document.getElementById('inverterBrand').value;
    if (automationSettings[brand] && automationSettings[brand][day]) {
      for (let hour = startHour; hour <= endHour; hour++) {
        delete automationSettings[brand][day][hour];
      }
    }

    localStorage.setItem(`automationSettings_${brand}`, JSON.stringify(automationSettings[brand]));
    row.parentNode.removeChild(row);
    alert('Automation settings deleted successfully');
  } else {
    alert('Invalid day or hour range');
  }
}

