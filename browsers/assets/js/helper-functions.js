// Helper Functions

// get series options for chart
function fill_seriesOptions(cat) {
  var seriesOptionsHere = [];

  pertTypes.forEach(function (ptype, h) {
    seriesOptionsHere.push({
      id: pertTypes[h],

      name: pertTypes[h],

      data: [],

      dashStyle: 'Solid',

      visible: true,

      color: "white"

    });
  });

  planData.forEach(function (element, i) {
    element.structureData.forEach(function (childElement, j) {
      var category = cat.find(
        category => category.name === childElement.structureId
      );
      if (!category.visible) {
        return;
      }
      let lineStyle = '';
      if (element.perturbationType == 'Nominal') {
        lineStyle = 'Solid';
      } else if (element.perturbationType.includes('Shift')) {
        lineStyle = 'LongDashDotDot';
      } else if (element.perturbationType.includes('Range')) {
        lineStyle = 'DashDot';
      } else if (element.perturbationType.includes('Rotation')) {
        lineStyle = 'LongDash';
      } else {
        lineStyle = 'ShortDash';
      }

      seriesOptionsHere.push({
        name: element.planId + "_" + childElement.structureId,

        data: childElement.dvh.sort(function (a, b) {
          return a[0] - b[0];
        }),

        // dashStyle: dashStyles[i],
        dashStyle: lineStyle,

        visible: true,

        color: childElement.structureColor,

        // here we can link each line to the same perturbationType defined in the JSON format

        // this allows us to turn on/off all the structures for a given perturbation type with one click

        // this was there is only one series for each pert type

        linkedTo: element.perturbationType
      });
    });
  });

  return seriesOptionsHere;
}

//create a checkbox for each category
function buildCheckBoxes() {
  $("#check-boxes ").empty();
  added_cbs = []
  $.each(contourCategories, function (i, cat) {
    if (!added_cbs.includes(cat.name)) {
      var box =
        '<label class="ml-3 mr-3 text-center font-weight-light" style="cursor:pointer;"><input class="mr-1" style="display:none;" type="checkbox" onChange="" id="' +
        String(cat.name) +
        '" name="' +
        String(cat.name) +
        '" val="' +
        String(cat.name) +
        '" checked="checked" />' +
        String(cat.name) +
        "</label>";

      $("#check-boxes ").append(box);
    }
    added_cbs.push(cat.name);

  });
}

// function to be fired when series button is toggled from hidden to visible
function seriesShowFunction(e) {
  var structuresToIgnore = [];
  $.each($("#check-boxes input"), function (i, box) {
    var checkbox = this;
    if (!checkbox.checked && !structuresToIgnore.includes(checkbox.name)) {
      structuresToIgnore.push(checkbox.name)
    }
  });

  structuresToIgnore.forEach((s) => {
    e.target.chart.series.forEach((series) => {
      if (series.userOptions.name.includes(s) && series.data.length > 0) {
        // if not structure not selected for view
        // hide series
        series.setVisible(false, false);
      }
    });
  });
}

// filter data table when structure check box is toggled
function filterDataTable() {
  // filter data table
  var newTableData = [];
  var checkedIds = getCheckedIds();
  dataTablesData.forEach((d) => {
    if (checkedIds.includes(d[0])) {
      newTableData.push(d);
    }
  });

  // destroy existing table
  $("#datatables-table").DataTable().destroy();
  // build new table
  fillDVHStatsTable(newTableData);
}

// get ids of structure checkboxes that are checked -- used to filter 
function getCheckedIds() {
  let ids = [];
  // adapted from https://stackoverflow.com/questions/28063963/how-to-filter-records-based-on-key-click
  if ($('input[type="checkbox"]:checked').length > 0) {
    // Get ids of all checked boxes
    ids = $('input[type="checkbox"]:checked').map(function () {
      return this.id;
    }).get();
  }
  return ids;
}

function fillDVHStatsTable(d) {
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
      headerOffset: $('#fixed').height()
    },
    autoWidth: false,
    pageLength: 50,
    // change cell font color based on value
    rowCallback: function (row, data, index) {
      if (Math.abs(data[3]) > 10) {
        $(row).find('td:eq(3)').css({ 'color': 'red', 'font-weight': "bold" });
      }
      if (Math.abs(data[5]) > 3) {
        $(row).find('td:eq(5)').css({ 'color': 'red', 'font-weight': "bold" });
      }
    }

  });

  $('#datatables-table th').addClass('text-center font-weight-light');
  $('#datatables-table td').addClass('text-center font-weight-light');
};
// aggregates max dose data (targets and oars)
function getMaxAggData(allData) {
  var structureAggData = d3.nest()
    .key(function (d) { return d[0]; })
    .rollup(function (v) {
      return {
        count: v.length,
        // max dose 
        max_maxDose: d3.max(v, function (d) { return parseFloat(d[2]); }).toFixed(2),
        min_maxDose: d3.min(v, function (d) { return parseFloat(d[2]); }).toFixed(2),
        range_maxDose: Math.abs(d3.max(v, function (d) { return parseFloat(d[2]); }) - d3.min(v, function (d) { return parseFloat(d[2]); })).toFixed(2),
        // max dose avg
        avg_maxDose: d3.mean(v, function (d) { return parseFloat(d[2]); }).toFixed(2),
        // max dose deltas
        max_maxDelta: d3.max(v, function (d) { return parseFloat(d[3]); }).toFixed(2),
        min_maxDelta: d3.min(v, function (d) { return parseFloat(d[3]); }).toFixed(2),
        range_maxDelta: Math.abs(d3.max(v, function (d) { return parseFloat(d[3]); }) - d3.min(v, function (d) { return parseFloat(d[3]); })).toFixed(2),
        // max dose delta avg
        avg_maxDelta: d3.mean(v, function (d) { return parseFloat(d[3]); }).toFixed(2),

      };
    })
    .entries(allData);

  var planAggData = d3.nest()
    .key(function (d) { return d[6]; })
    .rollup(function (v) {
      return {
        count: v.length,
        // max dose 
        max_maxDose: d3.max(v, function (d) { return parseFloat(d[2]); }).toFixed(2),
        min_maxDose: d3.min(v, function (d) { return parseFloat(d[2]); }).toFixed(2),
        range_maxDose: Math.abs(d3.max(v, function (d) { return parseFloat(d[2]); }) - d3.min(v, function (d) { return parseFloat(d[2]); })).toFixed(2),
        // max dose avg
        avg_maxDose: d3.mean(v, function (d) { return parseFloat(d[2]); }).toFixed(2),
        // max dose deltas
        max_maxDelta: d3.max(v, function (d) { return parseFloat(d[3]); }).toFixed(2),
        min_maxDelta: d3.min(v, function (d) { return parseFloat(d[3]); }).toFixed(2),
        range_maxDelta: Math.abs(d3.max(v, function (d) { return parseFloat(d[3]); }) - d3.min(v, function (d) { return parseFloat(d[3]); })).toFixed(2),
        // max dose delta avg
        avg_maxDelta: d3.mean(v, function (d) { return parseFloat(d[3]); }).toFixed(2),
      };
    })
    .entries(allData);

  return [structureAggData, planAggData];
}
// aggregates d95 data (targets only)
function getD95AggData(targetData) {
  var structureAggData = d3.nest()
    .key(function (d) { return d[0]; })
    .rollup(function (v) {
      return {
        count: v.length,
        // d95 
        max_d95: d3.max(v, function (d) { return parseFloat(d[4]); }).toFixed(2),
        min_d95: d3.min(v, function (d) { return parseFloat(d[4]); }).toFixed(2),
        range_d95: Math.abs(d3.max(v, function (d) { return parseFloat(d[4]); }) - d3.min(v, function (d) { return parseFloat(d[4]); })).toFixed(2),
        // d95 avg
        avg_d95: d3.mean(v, function (d) { return parseFloat(d[4]); }).toFixed(2),
        // d95 deltas
        max_d95Delta: d3.max(v, function (d) { return parseFloat(d[5]); }).toFixed(2),
        min_d95Delta: d3.min(v, function (d) { return parseFloat(d[5]); }).toFixed(2),
        range_d95Delta: Math.abs(d3.max(v, function (d) { return parseFloat(d[5]); }) - d3.min(v, function (d) { return parseFloat(d[5]); })).toFixed(2),
        // d95 delta avg
        avg_d95Delta: d3.mean(v, function (d) { return parseFloat(d[5]); }).toFixed(2),
      };
    })
    .entries(targetData);

  var planAggData = d3.nest()
    .key(function (d) { return d[6]; })
    .rollup(function (v) {
      return {
        count: v.length,
        // d95 
        max_d95: d3.max(v, function (d) { return parseFloat(d[4]); }).toFixed(2),
        min_d95: d3.min(v, function (d) { return parseFloat(d[4]); }).toFixed(2),
        range_d95: Math.abs(d3.max(v, function (d) { return parseFloat(d[4]); }) - d3.min(v, function (d) { return parseFloat(d[4]); })).toFixed(2),
        // d95 avg
        avg_d95: d3.mean(v, function (d) { return parseFloat(d[4]); }).toFixed(2),
        // d95 deltas
        max_d95Delta: d3.max(v, function (d) { return parseFloat(d[5]); }).toFixed(2),
        min_d95Delta: d3.min(v, function (d) { return parseFloat(d[5]); }).toFixed(2),
        range_d95Delta: Math.abs(d3.max(v, function (d) { return parseFloat(d[5]); }) - d3.min(v, function (d) { return parseFloat(d[5]); })).toFixed(2),
        // d95 delta avg
        avg_d95Delta: d3.mean(v, function (d) { return parseFloat(d[5]); }).toFixed(2),
      };
    })
    .entries(targetData);

  return [structureAggData, planAggData];
}

function fillAggDataTables(datalist) {
  // fill tables
  $("#max-agg-data-table").DataTable({
    data: datalist[0][0],
    columns: [
      // structure
      // d.key,
      // d.value.max_maxDose, //1
      // d.value.min_maxDose, //2
      // d.value.range_maxDose, //3
      // // max dose avg
      // d.value.avg_maxDose, //4
      // // max dose deltas
      // d.value.max_maxDelta, //5
      // d.value.min_maxDelta, //6
      // d.value.range_maxDelta, //7
      // // max dose delta avg
      // d.value.avg_maxDelta, //8

      { title: "Plan / Structure" },
      { title: "Max [Max[Gy]]" },
      { title: "Min [Max[Gy]]" },
      { title: "Range [Max[Gy]]" },
      { title: "Avg [Max[Gy]]" },
      { title: "Max [Max[%&#916;]]" },
      { title: "Min [Max[%&#916;]]" },
      { title: "Range [Max[%&#916;]]" },
      { title: "Avg [Max[%&#916;]]" }
    ],
    paging: true,
    fixedHeader: {
      header: false,
      headerOffset: $('#fixed').height()
    },
    autoWidth: false,
    pageLength: 10,
    // change cell font color based on value
    rowCallback: function (row, data, index) {
      if (Math.abs(data[5]) > 3) {
        $(row).find('td:eq(5)').css({ 'color': 'red', 'font-weight': "bold" });
      }
      if (Math.abs(data[6]) > 3) {
        $(row).find('td:eq(6)').css({ 'color': 'red', 'font-weight': "bold" });
      }
      if (Math.abs(data[7]) > 3) {
        $(row).find('td:eq(7)').css({ 'color': 'red', 'font-weight': "bold" });
      }
      if (Math.abs(data[8]) > 3) {
        $(row).find('td:eq(8)').css({ 'color': 'red', 'font-weight': "bold" });
      }
    }

  });

  $('#max-agg-data-table th').addClass('text-center font-weight-light');
  $('#max-agg-data-table td').addClass('text-center font-weight-light');

  $("#d95-agg-data-table").DataTable({
    data: datalist[0][1],
    columns: [
      // structure
      // // d95 
      // d.value.max_d95, //1
      // d.value.min_d95, //2
      // d.value.range_d95, //3
      // // d95 avg
      // d.value.avg_d95, //4
      // // d95 deltas
      // d.value.max_d95Delta, //5
      // d.value.min_d95Delta, //6
      // d.value.range_d95Delta, //7
      // // d95 delta avg
      // d.value.avg_d95Delta, //8

      { title: "Plan / Structure" },
      { title: "Max [D95[Gy]]" },
      { title: "Min [D95[Gy]]" },
      { title: "Range [D95[Gy]]" },
      { title: "Avg [D95[Gy]]" },
      { title: "Max [D95[%&#916;]]" },
      { title: "Min [D95[%&#916;]]" },
      { title: "Range [D95[%&#916;]]" },
      { title: "Avg [D95[%&#916;]]" }
    ],
    paging: true,
    fixedHeader: {
      header: false,
      headerOffset: $('#fixed').height()
    },
    autoWidth: false,
    pageLength: 10,
    // change cell font color based on value
    rowCallback: function (row, data, index) {
      if (Math.abs(data[5]) > 10) {
        $(row).find('td:eq(5)').css({ 'color': 'red', 'font-weight': "bold" });
      }
      if (Math.abs(data[6]) > 10) {
        $(row).find('td:eq(6)').css({ 'color': 'red', 'font-weight': "bold" });
      }
      if (Math.abs(data[7]) > 10) {
        $(row).find('td:eq(7)').css({ 'color': 'red', 'font-weight': "bold" });
      }
      if (Math.abs(data[8]) > 10) {
        $(row).find('td:eq(8)').css({ 'color': 'red', 'font-weight': "bold" });
      }
    }

  });

  $('#d95-agg-data-table th').addClass('text-center font-weight-light');
  $('#d95-agg-data-table td').addClass('text-center font-weight-light');
};

function hideNextElement(e) {
  $(e).next().toggleClass('hidden')
}

// Event Listeners

// checkbox toggle event for filtering chart and data table
$(document).on("click", "#check-boxes input", function (e) {
  var checkbox = e.target;
  var toIgnore = [];
  // get series to ignore / not toggle
  $.each(chart.series, function (i, series) {
    if (series.data.length == 0 && series.visible == false) {
      toIgnore.push(series.userOptions.name);
    }
  });
  $(e.target).parent().toggleClass("text-muted striked");

  // toggle series visibility
  $.each(chart.series, function (i, series) {
    if (series.userOptions.name.includes(e.target.id)) {
      // if not checked
      if (!e.target.checked) {
        // hide series
        series.setVisible(false, false);
      } else { // if checked
        // if linkedTo series visible
        if (!toIgnore.includes(series.userOptions.linkedTo)) {
          series.setVisible(true, false);
        } else { // if linkedTo series not visible
          series.setVisible(false, false);
        }
      }
    }
  });

  filterDataTable();

});