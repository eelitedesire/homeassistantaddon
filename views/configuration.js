
  let inverterSettings = {};
 
 function saveInverterConfig() {
   const brand = document.getElementById('inverterBrand').value;
   if (brand) {
     const inverterConfig = getInverterConfigFromForm();
 
     fetch('/save-inverter-config', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ [brand]: inverterConfig })
     })
     .then(response => response.json())
     .then(data => {
       alert(data.message);
       inverterSettings[brand] = inverterConfig; // Update the local inverterSettings object
     })
     .catch(error => alert(`Error: ${error}`));
   } else {
     alert('Please select an inverter brand');
   }
 }
 
 function getInverterConfigFromForm() {
   const workMode = document.getElementById('workMode').value;
   const energyPattern = document.getElementById('energyPattern').value;
   const maxSellPower = document.getElementById('maxSellPower').value;
   const solarExportWhenBatteryFull = document.getElementById('solarExportWhenBatteryFull').value === 'true';
 
   return {
     workMode,
     energyPattern,
     maxSellPower,
     solarExportWhenBatteryFull
   };
 }
 
 function showInverterSettings(brand) {
   const inverterSettingsContainer = document.getElementById('inverterSettingsContainer');
   inverterSettingsContainer.innerHTML = '';
 
   if (brand) {
     inverterSettingsContainer.innerHTML = `
       <div>
         <label for="workMode">Work Mode:</label>
         <input type="text" id="workMode" name="workMode" placeholder="Work Mode">
       </div>
       <div>
         <label for="energyPattern">Energy Pattern:</label>
         <input type="text" id="energyPattern" name="energyPattern" placeholder="Energy Pattern">
       </div>
       <div>
         <label for="maxSellPower">Max Sell Power:</label>
         <input type="text" id="maxSellPower" name="maxSellPower" placeholder="Sell Power">
       </div>
       <div>
         <label for="solarExportWhenBatteryFull">Solar Export When Battery Full:</label>
         <select id="solarExportWhenBatteryFull" name="solarExportWhenBatteryFull">
           <option value="true">True</option>
           <option value="false">False</option>
         </select>
       </div>
     `;
   }
 }
  