/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "read"], "isController": true}, {"data": [1.0, 500, 1500, "read_person"], "isController": false}, {"data": [1.0, 500, 1500, "delete_todo"], "isController": false}, {"data": [1.0, 500, 1500, "create"], "isController": true}, {"data": [1.0, 500, 1500, "update"], "isController": true}, {"data": [1.0, 500, 1500, "create_person"], "isController": false}, {"data": [1.0, 500, 1500, "update_person"], "isController": false}, {"data": [1.0, 500, 1500, "create_todo"], "isController": false}, {"data": [1.0, 500, 1500, "read_todo"], "isController": false}, {"data": [1.0, 500, 1500, "update_todo"], "isController": false}, {"data": [1.0, 500, 1500, "delete"], "isController": true}, {"data": [1.0, 500, 1500, "delete_person"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 84703, 0, 0.0, 1.598939825035712, 0, 112, 1.0, 2.0, 2.0, 3.0, 657.1880794804752, 184.9085296737646, 131.56907189049323], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["read", 11045, 0, 0.0, 2.275328202806709, 0, 15, 2.0, 3.0, 4.0, 5.0, 86.47755654904049, 53.50772814865997, 26.811477140603344], "isController": true}, {"data": ["read_person", 11045, 0, 0.0, 1.1494794024445396, 0, 13, 1.0, 2.0, 2.0, 3.0, 86.47687947260457, 29.124213012441086, 13.886528823342886], "isController": false}, {"data": ["delete_todo", 10195, 0, 0.0, 1.5613536047081944, 0, 16, 2.0, 2.0, 2.0, 4.0, 82.41913708497377, 15.373100764873037, 15.004184873117374], "isController": false}, {"data": ["create", 11119, 0, 0.0, 4.057469196870233, 1, 139, 3.0, 4.0, 5.0, 24.799999999999272, 86.8271656033547, 51.36940358057614, 41.16966776544405], "isController": true}, {"data": ["update", 10370, 0, 0.0, 3.2760848601735657, 1, 18, 3.0, 4.0, 5.0, 7.0, 83.83185125303153, 53.550353362469686, 36.67362444421988], "isController": true}, {"data": ["create_person", 11119, 0, 0.0, 2.7310909254429427, 1, 112, 2.0, 2.0, 3.0, 15.0, 86.94802198919308, 25.51028886230167, 18.934969632412166], "isController": false}, {"data": ["update_person", 10370, 0, 0.0, 1.6216007714561218, 0, 16, 2.0, 2.0, 2.0, 4.0, 83.83320668078707, 28.31443881974648, 17.47291191298566], "isController": false}, {"data": ["create_todo", 11081, 0, 0.0, 1.3308365670968303, 0, 28, 1.0, 2.0, 2.0, 8.0, 86.75806236934616, 25.962694292531495, 22.319579346026167], "isController": false}, {"data": ["read_todo", 10407, 0, 0.0, 1.1948688382819204, 0, 10, 1.0, 2.0, 2.0, 3.0, 84.1316421313026, 25.176095299881162, 13.345083125166736], "isController": false}, {"data": ["update_todo", 10331, 0, 0.0, 1.6607298422224437, 0, 15, 2.0, 2.0, 3.0, 5.0, 83.51927305652568, 25.23718841201413, 19.201615945038643], "isController": false}, {"data": ["delete", 10195, 0, 0.0, 3.0619911721431934, 1, 17, 3.0, 4.0, 4.0, 6.0, 82.41913708497377, 30.685885293297332, 30.109707339304915], "isController": true}, {"data": ["delete_person", 10155, 0, 0.0, 1.5065484982767035, 0, 13, 1.0, 2.0, 2.0, 4.0, 82.0970936577873, 15.313032117809936, 15.105766704393872], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 84703, 0, null, null, null, null, null, null, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
