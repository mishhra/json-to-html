export function convertJsonToTable(jsonData, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !jsonData) {
    console.error("Invalid data or container.");
    return;
  }

  // Recursive function to build table
  function buildTable(data) {
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";
    table.style.background = "#fff";
    table.style.borderRadius = "8px";
    table.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)";
    table.style.overflow = "hidden";
    table.style.marginBottom = "16px";

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
      // Transpose: keys as first column, values as columns
      const keys = Array.from(new Set(data.flatMap((obj) => Object.keys(obj))));
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      headerRow.appendChild(document.createElement("th")); // Empty top-left cell
      data.forEach((_, idx) => {
        const th = document.createElement("th");
        th.textContent = `Object ${idx + 1}`;
        th.style.border = "1px solid #e2e2e2";
        th.style.padding = "10px 12px";
        th.style.backgroundColor = "#f4f4f4";
        th.style.fontWeight = "600";
        th.style.color = "#333";
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      keys.forEach((key) => {
        const row = document.createElement("tr");
        const keyCell = document.createElement("td");
        keyCell.textContent = key;
        keyCell.style.border = "1px solid #e2e2e2";
        keyCell.style.padding = "10px 12px";
        keyCell.style.fontWeight = "bold";
        keyCell.style.background = "#fafbfc";
        row.appendChild(keyCell);

        // Collect values for comparison
        const values = data.map((obj) => {
          const value = obj[key];
          if (typeof value === "object" && value !== null) {
            return "[object]"; // Use a placeholder for objects
          }
          return value ?? "—";
        });

        data.forEach((obj, colIdx) => {
          const td = document.createElement("td");
          td.style.border = "1px solid #e2e2e2";
          td.style.padding = "10px 12px";
          td.style.background = "#fff";
          const value = obj[key];
          if (typeof value === "object" && value !== null) {
            td.appendChild(buildTable(value));
          } else {
            td.textContent = value ?? "—";
          }
          // Highlight if value is different from at least one other column
          if (
            values.length > 1 &&
            values.some((v, i) => i !== colIdx && v !== values[colIdx])
          ) {
            td.style.background = "#fffbe6"; // light yellow
          }
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
    } else if (typeof data === "object" && data !== null) {
      // If data is an object, show key-value pairs
      const tbody = document.createElement("tbody");
      for (const key in data) {
        const row = document.createElement("tr");

        const keyCell = document.createElement("td");
        keyCell.textContent = key;
        keyCell.style.border = "1px solid #e2e2e2";
        keyCell.style.padding = "10px 12px";
        keyCell.style.fontWeight = "bold";
        keyCell.style.background = "#fafbfc";

        const valueCell = document.createElement("td");
        valueCell.style.border = "1px solid #e2e2e2";
        valueCell.style.padding = "10px 12px";
        valueCell.style.background = "#fff";

        const value = data[key];
        if (typeof value === "object" && value !== null) {
          valueCell.appendChild(buildTable(value)); // Recursive call
        } else {
          valueCell.textContent = value ?? "—";
        }

        row.appendChild(keyCell);
        row.appendChild(valueCell);
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
    } else {
      // For primitive values
      const tbody = document.createElement("tbody");
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.textContent = data;
      cell.style.border = "1px solid #e2e2e2";
      cell.style.padding = "10px 12px";
      cell.style.background = "#fff";
      row.appendChild(cell);
      tbody.appendChild(row);
      table.appendChild(tbody);
    }

    return table;
  }

  container.innerHTML = ""; // Clear previous content
  container.appendChild(buildTable(jsonData));
}

// Helper to extract JSON from mixed content
function extractJsonFromContent(content) {
  // Find first '{' or '[' and last '}' or ']'
  let startObj = content.indexOf("{");
  let startArr = content.indexOf("[");
  let start =
    startObj === -1
      ? startArr
      : startArr === -1
      ? startObj
      : Math.min(startObj, startArr);
  let endObj = content.lastIndexOf("}");
  let endArr = content.lastIndexOf("]");
  let end =
    endObj === -1 ? endArr : endArr === -1 ? endObj : Math.max(endObj, endArr);

  if (start === -1 || end === -1 || end < start)
    return { pre: content, json: null };

  const pre = content.slice(0, start).trim();
  const jsonStr = content.slice(start, end + 1);
  try {
    const json = JSON.parse(jsonStr);
    return { pre, json };
  } catch {
    return { pre: content, json: null };
  }
}

let history = [];
let entryId = 1;

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("convert-btn");
  const modal = document.getElementById("modal");
  const closeModal = document.getElementById("close-modal");
  const tableContainer = document.getElementById("table-container");
  const textarea = document.getElementById("json-input");
  const historyTableBody = document.querySelector("#history-table tbody");

  function addHistoryEntry(content) {
    const timestamp = new Date().toLocaleString();
    const id = entryId++;
    history.push({ id, timestamp, content });
    renderHistory();
  }

  function renderHistory() {
    historyTableBody.innerHTML = "";
    history.forEach((entry) => {
      const row = document.createElement("tr");

      // ID
      const idCell = document.createElement("td");
      idCell.textContent = entry.id;
      row.appendChild(idCell);

      // Timestamp
      const tsCell = document.createElement("td");
      tsCell.textContent = entry.timestamp;
      row.appendChild(tsCell);

      // Content (truncated)
      const contentCell = document.createElement("td");
      let str = entry.content;
      let truncated =
        str.length > 100 ? str.slice(0, 100) + "...read more" : str;
      contentCell.textContent = truncated;

      if (str.length > 100) {
        contentCell.innerHTML = `<span>${str.slice(
          0,
          100
        )}</span> <a href="#" class="read-more" data-id="${
          entry.id
        }">read more</a>`;
      }

      row.appendChild(contentCell);
      historyTableBody.appendChild(row);
    });
  }

  btn.addEventListener("click", () => {
    const content = textarea.value;
    const { pre, json } = extractJsonFromContent(content);

    if (!json) {
      tableContainer.innerHTML =
        "<span style='color:red;'>Invalid JSON!</span>";
      modal.style.display = "flex";
      return;
    }

    addHistoryEntry(content);

    tableContainer.innerHTML = "";
    if (pre) {
      const preDiv = document.createElement("div");
      preDiv.textContent = pre;
      preDiv.style.marginBottom = "12px";
      tableContainer.appendChild(preDiv);
    }
    convertJsonToTable(json, "table-container");
    modal.style.display = "flex";
  });

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Delegate read more clicks
  historyTableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("read-more")) {
      e.preventDefault();
      const id = Number(e.target.getAttribute("data-id"));
      const entry = history.find((h) => h.id === id);
      if (entry) {
        const { pre, json } = extractJsonFromContent(entry.content);
        tableContainer.innerHTML = "";
        if (pre) {
          const preDiv = document.createElement("div");
          preDiv.textContent = pre;
          preDiv.style.marginBottom = "12px";
          tableContainer.appendChild(preDiv);
        }
        if (json) {
          convertJsonToTable(json, "table-container");
        } else {
          tableContainer.innerHTML +=
            "<span style='color:red;'>Invalid JSON!</span>";
        }
        modal.style.display = "flex";
      }
    }
  });
});
