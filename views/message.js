
  const influxDBEndpoint = 'http://192.168.160.55:8086/query?db=homeassistant&u=admin&p=adminadmin';
  const messageLimit = 200; // Set the maximum number of messages to display

  async function fetchMessages() {
      const category = document.getElementById('category').value;
      let query = `SELECT * FROM "state" WHERE "topic" =~ /solar_assistant_DEYE.*/ ORDER BY time DESC LIMIT ${messageLimit}`;

      if (category) {
          switch (category) {
              case 'inverter_1':
                  query = `SELECT * FROM "state" WHERE "topic" =~ /solar_assistant_DEYE\\/inverter_1.*/ ORDER BY time DESC LIMIT ${messageLimit}`;
                  break;
              case 'inverter_2':
                  query = `SELECT * FROM "state" WHERE "topic" =~ /solar_assistant_DEYE\\/inverter_2.*/ ORDER BY time DESC LIMIT ${messageLimit}`;
                  break;
              case 'load_power':
                  query = `SELECT * FROM "state" WHERE "topic" =~ /solar_assistant_DEYE.*\\/load_power.*/ ORDER BY time DESC LIMIT ${messageLimit}`;
                  break;
              case 'grid_power':
                  query = `SELECT * FROM "state" WHERE "topic" =~ /solar_assistant_DEYE.*\\/grid_power.*/ ORDER BY time DESC LIMIT ${messageLimit}`;
                  break;
              case 'battery_1':
                  query = `SELECT * FROM "state" WHERE "topic" =~ /solar_assistant_DEYE\\/battery_1.*/ ORDER BY time DESC LIMIT ${messageLimit}`;
                  break;
              case 'battery_2':
                  query = `SELECT * FROM "state" WHERE "topic" =~ /solar_assistant_DEYE\\/battery_2.*/ ORDER BY time DESC LIMIT ${messageLimit}`;
                  break;
              case 'battery_3':
                  query = `SELECT * FROM "state" WHERE "topic" =~ /solar_assistant_DEYE\\/battery_3.*/ ORDER BY time DESC LIMIT ${messageLimit}`;
                  break;
          }
      }

      try {
          const response = await fetch(influxDBEndpoint, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `q=${encodeURIComponent(query)}`
          });

          if (!response.ok) {
              throw new Error('Network response was not ok ' + response.statusText);
          }

          const data = await response.json();
          displayMessages(data);
      } catch (error) {
          console.error('Error fetching messages:', error);
          document.getElementById('message-container').innerText = 'Error fetching messages';
      }
  }

  function displayMessages(data) {
      const messageContainer = document.getElementById('message-container');
      messageContainer.innerHTML = ''; // Clear previous messages

      if (data.results && data.results[0] && data.results[0].series && data.results[0].series[0]) {
          const messages = data.results[0].series[0].values;
          const columns = data.results[0].series[0].columns;
          const table = document.createElement('table');
          table.innerHTML = `<caption>Messages</caption>
                          <thead>
                              <tr>
                                  <th>Topic</th>
                                  <th>Value</th>
                              </tr>
                          </thead>`;

          const tbody = document.createElement('tbody');
          messages.forEach(message => {
              const tr = document.createElement('tr');
              const topicIndex = columns.indexOf('topic');
              const valueIndex = columns.indexOf('value');
              tr.innerHTML = `<td>${message[topicIndex]}</td>
                              <td>${message[valueIndex]}</td>`;
              tbody.appendChild(tr);
          });

          table.appendChild(tbody);
          messageContainer.appendChild(table);
      } else {
          messageContainer.innerText = 'No messages found';
      }
  }

  document.addEventListener('DOMContentLoaded', fetchMessages);
