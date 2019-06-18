
var dataTablesData = [];


function fillDataTables(d) {
  // fill tables
  $("#datatables-table").DataTable({
    data: d,
    columns: [
      // structure
      // Structure: data[i][0],
      // PlanID: data[i][1],
      // MaxDose: data[i][2],
      // "Delta Max": data[i][3],
      // D95: data[i][4],
      // "Delta D95": data[i][5],

      // <th>Structure</th>
      // <th>Plan</th>
      // <th>Max Dose (Gy)</th>
      // <th>Max %&#916;</th>
      // <th>D95 (Gy)</th>
      // <th>D95 %&#916;</th>

      { title: "Structure" },
      { title: "Plan" },
      { title: "Max Dose [Gy]" },
      { title: "Max %&#916" },
      { title: "D95 [Gy]" },
      { title: "D95 %&#916" }
    ],
    paging: true,
    fixedHeader: {
      header: true,
      // footer: true
    },
    autoWidth: false,
    pageLength: 50,

  });
};