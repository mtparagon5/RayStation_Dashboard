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
        '<label class="ml-5 text-center"><input class="mr-1" type="checkbox" onChange="" id="' +
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
  fillDataTables(newTableData);
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
};

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