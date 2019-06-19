// basic loadfile function combined with other functions to manipulate the data in the file and visualize it

function loadFile() {
  // this first portion simply loads the file

  var input, file, fr, js;

  if (typeof window.FileReader !== "function") {
    alert("The file API isn't supported on this browser yet.");

    return;
  }

  input = document.getElementById("fileinput");

  if (!input) {
    alert("Um, couldn't find the fileinput element.");
  } else if (!input.files) {
    alert(
      "This browser doesn't seem to support the `files` property of file inputs."
    );
  } else if (!input.files[0]) {
    alert("Please select a file before clicking 'Load'");
  } else {
    file = input.files[0];

    fr = new FileReader();

    fr.onload = receivedText;

    fr.readAsText(file);
  }

  // This function will read the text in the file that is loaded, manipulate it, and create the graphs/tables

  function receivedText(e) {

    PlanJSONArray = JSON.parse(e.target.result);
    planData = PlanJSONArray[0].planData;

    // create the dvh chart settings using highcharts

    // for documentation: https://www.highcharts.com/

    $(document).ready(function () {
      // call init function
      init();

      // Main Functions

      // initiate data collection, create chart, etc.
      function init() {
        contourCategories = [];

        var jsonArray = PlanJSONArray[0];

        // define plan parameters
        document.getElementById("patientName").innerHTML = jsonArray.patientName;
        document.getElementById("mrn").innerHTML = jsonArray.patientId;
        document.getElementById("planId").innerHTML = jsonArray.planName;
        document.getElementById("BeamSetName").innerHTML = jsonArray.BeamSetName;

        // data collection / processing
        var structureID = [];
        planData.forEach(function (pdata, i) {
          pdata.structureData.forEach(function (sdata, j) {
            // get categories
            structureID.push(new Category(sdata.structureId, pdata.perturbationType));

            // collect data for tables
            // get nominal data
            if (pdata.perturbationType == "Nominal") {
              nomData.push([
                sdata.structureId,
                pdata.planId,
                parseFloat(sdata.structureMaxDose) / 100.0,
                parseFloat(sdata.structureD95) / 100.0
              ]); //Dmax and D95 in Gy
            }
            // calculate deltas relative to nominal data
            nomData.forEach(function (val, i) {
              if (nomData[i][0] == sdata.structureId) {
                var d95Ratio = 0;

                var D95Gy = (
                  parseFloat(sdata.structureD95) / 100.0
                ).toFixed(2);

                if (nomData[i][3] != 0) {
                  d95Ratio = (
                    ((D95Gy - nomData[i][3]) / Math.abs(nomData[i][3])) *
                    100
                  ).toFixed(2);
                }

                var maxDose = (
                  parseFloat(sdata.structureMaxDose) / 100.0
                ).toFixed(2);

                var maxRatio = (
                  ((maxDose - nomData[i][2]) / Math.abs(nomData[i][2])) *
                  100
                ).toFixed(2);

                data.push([
                  pdata.structureData[j].structureId,
                  pdata.planId,
                  maxDose,
                  maxRatio,
                  D95Gy,
                  d95Ratio,
                  pdata.perturbationType,
                  sdata.structureType
                ]);
              }
            });
          });

          // get pert types
          if (!pertTypes.includes(planData[i].perturbationType)) {
            pertTypes.push(planData[i].perturbationType);
          }

        });

        // fill contour categories and assign index
        contourCategories = structureID.map(function (cat, i) {
          // assign index
          cat.index = i;

          return cat;
        });

        // get series options
        seriesOptions = fill_seriesOptions(contourCategories);

        // add checkboxes for each structure
        buildCheckBoxes();

        // fill plan parameters table
        if (jsonArray.optShifts != null) {
          // this processes the robust shift information

          var robustShiftsArr = [];

          var params = jsonArray.optShifts.replace(" ", "");

          var processedParams = params.slice(params.indexOf(":") + 2);

          var processedParamsArr = new Array();

          processedParamsArr = processedParams.split(",");

          processedParamsArr.forEach(function (val, i) {
            robustShiftsArr.push(parseFloat(val));
          });

          /*Robust Shift Order: [S, I, A, P, R, L]*/
          $("#plan-params-table").append(
            `<thead>
                <tr>
                  <th>Range [%]</th>
                  <th>Left [cm]</th>
                  <th>Right [cm]</th>
                  <th>Ant [cm]</th>
                  <th>Post [cm]</th>
                  <th>Sup [cm]</th>
                  <th>Inf [cm]</th>
                  <th>Ind. Beams?</th>
                </tr>
              </thead>`
          );
          $("#plan-params-tbody").append(
            '<tr class="paramsRow" align="center">' +
            "<td>" +
            jsonArray.optDensity.replace('"', "") +
            "</td>" +
            "<td>" +
            robustShiftsArr[5].toFixed(1) +
            "</td>" /*left*/ +
            "<td>" +
            robustShiftsArr[4].toFixed(1) +
            "</td>" /*right*/ +
            "<td>" +
            robustShiftsArr[2].toFixed(1) +
            "</td>" /*ant*/ +
            "<td>" +
            robustShiftsArr[3].toFixed(1) +
            "</td>" /*post*/ +
            "<td>" +
            robustShiftsArr[0].toFixed(1) +
            "</td>" /*sup*/ +
            "<td>" +
            robustShiftsArr[1].toFixed(1) +
            "</td>" /*inf*/ +
            "<td>" +
            jsonArray.indBeams.replace('"', "") +
            "</td>" +
            "</tr>"
          );
        }

        // sorting data alphabetically by structure
        data.sort();

        // separate target data for d95 agg data
        var targetData = [];
        data.forEach((d) => {
          if (d[7] != "Organ") {
            targetData.push(d);
          }
        });

        // aggregate data summary
        var aggData = [];
        var maxDoseAggData = [];
        var d95AggData = [];
        var maxAggDataList = getMaxAggData(data);
        var d95AggDataList = getD95AggData(targetData);
        maxAggDataList.forEach(function (v) {
          v.forEach(function (d) {
            maxDoseAggData.push([
              d.key,
              d.value.max_maxDose, //1
              d.value.min_maxDose, //2
              d.value.range_maxDose, //3
              // max dose avg
              d.value.avg_maxDose, //4
              // max dose deltas
              d.value.max_maxDelta, //5
              d.value.min_maxDelta, //6
              d.value.range_maxDelta, //7
              // max dose delta avg
              d.value.avg_maxDelta, //8
            ])
          })
        });
        d95AggDataList.forEach(function (v) {
          v.forEach(function (d) {
            d95AggData.push([
              d.key,
              // d95 
              d.value.max_d95, //1
              d.value.min_d95, //2
              d.value.range_d95, //3
              // d95 avg
              d.value.avg_d95, //4
              // d95 deltas
              d.value.max_d95Delta, //5
              d.value.min_d95Delta, //6
              d.value.range_d95Delta, //7
              // d95 delta avg
              d.value.avg_d95Delta, //8
            ]);
          });
        });
        aggData.push([maxDoseAggData, d95AggData]);

        fillAggDataTables(aggData);

        // Create DVH Stats Table

        // get data for table
        data.forEach(function (arr, i) {
          if (data[i][7] == "Organ") {

            // If the structure is not a "Target", only populate id, plan, max dose, and max % diff (omit D95 and D95 % diff)
            dataTablesData.push([
              data[i][0],
              data[i][1],
              data[i][2],
              data[i][3],
              "--",
              "--"
            ]);
          } else {
            dataTablesData.push([
              data[i][0],
              data[i][1],
              data[i][2],
              data[i][3],
              data[i][4],
              data[i][5]
            ]);
          }
        });

        //  fill dvh stats tables
        fillDataTables(dataTablesData);

        $('th').addClass('text-center font-weight-light');
        $('td').addClass('text-center font-weight-light');

        // chart options
        var chartOptions = {
          chart: {
            renderTo: "dvh",

            type: "spline",

            zoomType: "xy",

            panning: true,

            panKey: "shift",

            height: 600,

            // this will keep the x axis the same when series are removed (won't rescale)
            ignoreHiddenSeries: false
          },
          // this removes the highcharts label/credit in the lower rt hand corner
          credits: {
            enabled: false
          },

          // this disables the built in print/exporting buttons to ensure the data is not sent to HCs servers

          exporting: {
            buttons: {
              contextButton: {
                enabled: false
              }
            }
          },

          xAxis: {
            title: {
              text: "Dose (cGy)"
            },

            floor: 0.5,

            crosshair: true,

            maxPadding: 0.02
          },

          plotOptions: {
            series: {
              marker: {
                enabled: false
              },
              events: {
                show: seriesShowFunction
              },

              allowPointSelect: true,

              states: {
                hover: {
                  enabled: true,

                  lineWidth: 5
                }
              }
            },

            boxplot: {
              fillColor: "#505053"
            },

            candlestick: {
              lineColor: "white"
            },

            errorbar: {
              color: "white"
            }
          },

          yAxis: {
            labels: {
              format: "{value} %"
            },

            floor: 0,

            ceiling: 100,

            title: {
              text: "Volume (%)"
            },

            crosshair: true,

            gridLineDashStyle: "ShortDash",

            gridLineColor: "#aaaaaa"
          },

          tooltip: {
            positioner: function () {
              return {
                x: 100,
                y: 0
              };
            },

            shared: true,

            useHTML: true,
            // tooltip on chart hover
            // NOTE: only one point is shown on hover because the x values are different for each series
            // this is because the dose at volume is collected as opposed to volume at dose
            // if you want each of the values to show on hover, simply collect volume at dose instead
            formatter: function () {
              var s =
                '<table><strong style="color:#0a114a;">V' +
                this.x +
                " cGy:</strong>";

              // var sortedPoints = this.points.sort(function(a, b) {
              //     return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
              // });

              var sortedPoints = this.points.sort(function (a, b) {
                return a.series.name < b.series.name ?
                  -1 :
                  a.series.name > b.series.name ?
                    1 :
                    0;
              });

              $.each(sortedPoints, function (i, point) {
                if (point.y < 100 && point.y > 0) {
                  var last_ = point.series.name.lastIndexOf("_");
                  var plan = point.series.name.slice(0, last_);
                  var structure = point.series.name.slice(last_ + 1);
                  s +=
                    '<tr><td style="color:#0a114a;">' +
                    plan +
                    '</td><td style="color:#0a114a;">&nbsp;&nbsp;&nbsp;&nbsp;' +
                    structure +
                    '</td><td style="text-align: left; color:#0a114a">&nbsp;&nbsp;&nbsp;&nbsp;' +
                    Highcharts.numberFormat(point.y, 2, ".") +
                    "%</td></tr>";
                }
              });
              s += "</table>";
              return s;
            }
          },

          title: {
            text: "",

            x: 0
          },

          subtitle: {
            text: "Click and drag to zoom in. Hold down shift key to pan.",

            x: 0
          },
          // use this to change position of legend
          legend: {
            align: "center",
            verticalAlign: "bottom",
            itemDistance: 50,
            itemStyle: {
              color: "#0a114a",
              fontWeight: "regular"
            },
            itemHiddenStyle: {
              color: "red"
            }
          },

          // the settings for the individual series are defined below but loaded here

          series: seriesOptions
        };

        // create chart
        chart = new Highcharts.Chart(chartOptions);
      }

    });
  }

}

