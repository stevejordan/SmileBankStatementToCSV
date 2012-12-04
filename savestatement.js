(function (w, d, undefined) {

    "use strict";

    // Init variables
    var csv = "",
        entries = [],
        head  = d.getElementsByTagName("head")[0];

    // Thanks to http://www.squidoo.com/load-jQuery-dynamically
    function load() {

        // load CSS for fancybox
        var link  = d.createElement("link");
        link.rel  = "stylesheet";
        link.type = "text/css";
        link.href = "https://raw.github.com/fancyapps/fancyBox/master/source/jquery.fancybox.css";
        link.media = "all";
        head.appendChild(link);

        // load JS libraries
        if (typeof jQuery === "undefined" ||
            !("fancybox" in w.jQuery)) {

            getScript("https://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js");
            getScript("https://raw.github.com/fancyapps/fancyBox/master/source/jquery.fancybox.pack.js");

        }

        tryReady(0); // We will write this function later. It's responsible for waiting until jQuery loads before using it.

    } // load

    // dynamically load any javascript file.
    function getScript(filename) {

        var script = d.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", filename);
        head.appendChild(script);

    } // getScript

    function tryReady(time_elapsed) {

        // Continually polls to see if jQuery and fancybox are loaded.
        if (typeof jQuery === "undefined" ||
            !("fancybox" in w.jQuery)) { // if jQuery isn't loaded yet...

            if (time_elapsed <= 5000) { // and we haven't given up trying...
                w.setTimeout("tryReady(" + (time_elapsed + 200) + ")", 200); // set a timer to check again in 200 ms.
            } else {
                w.alert("Timed out while loading :( Try again?");
            }

        } else {

            // JQuery loaded - let's get cracking...

            //
            // Get the actual data and convert to the simplest CSV format FreeAgent supports, as per:
            // http://www.freeagentcentral.com/support/kb/banking/file-format-for-bank-upload-csv
            //
            // Will break if Smile change their site layout, etc, but that doesn't seem likely anytime soon.. if it does, let me know!
            //

            var tables = $("table.summaryTable"),
                i = 0, // index of table to user
                table,
                rows,
                rowCount,
                currentRow;

            if (tables.length > 1) {
                i = 1;
            }

            $(tables[i]).attr("id", "statementTable");

            table = $("#statementTable");
            rows = $("tbody tr", table);

            rowCount = 0;

            rows.each(function () {

                rowCount++;
                // console.log("Parsing row: " + rowCount);

                var rowData = {},
                    value,
                    cellCount = 0,
                    cells = $("td", $(this));

                cells.each(function () {

                    //console.log("Cell " + cellCount + ": " + $(this).attr("innerHTML"));

                    switch (cellCount) {

                    case 0: // Transaction date. Nice and easy...
                        rowData.date = $(this).html().trim();
                        break;

                    case 1: // The description, save it.

                        var description = $(this).html();

                        if (description === "BROUGHT FORWARD" ||
                            description === "*LAST STATEMENT*") {

                            // This is a balance forwarding row, ignore it.
                            // console.log("No description, ignoring this row...");
                            rowData.ignore = true;
                            break;

                        }

                        description = description.trim();
                        description = description.replace("&amp;", "&");

                        // console.log("Description: " + description);
                        rowData.description = description;

                        break;

                    case 2:

                        // Check if there's a "paid in" or positive entry
                        value = $(this).html().trim();
                        value = value.replace("&nbsp;", "");

                        if (value !== "") {
                            // console.log("Value: " + value);
                            rowData.value = value;
                        }

                        break;

                    case 3:

                        // Check if there's a "paid out" or negative entry
                        value = $(this).html().trim();
                        value = value.replace("&nbsp;", "");

                        if (value !== "") {
                            value = "-" + value;
                            // console.log("Value: " + value);
                            rowData.value = value;
                        }

                        break;

                    } //end switch

                    cellCount++;

                }); // end cells.each

                // Check if the row has a value, ignore it if not.
                if (typeof rowData.value === "undefined") {
                    rowData.ignore = true;
                }

                // Add the row data to the entries array
                entries.push(rowData);

            });

            // Serialize the entries array
            for (i = 0; i < entries.length; i++) {

                currentRow = entries[i];

                if (!currentRow.ignore) {
                    csv += currentRow.date.replace("/", "-") + ";;;;" + currentRow.description +
                        ";" + currentRow.value.replace(/[^\-0-9.]/g, "") + ";\n";
                }

            }

            //alert(csv);

            // show csv content in fancybox
            $.fancybox({

                "content" : csv,
                height: 300,
                afterShow: function () {
                    // select text for added convenience
                    fnSelect($(".fancybox-inner").get(0));
                }
            });

        }
    } // end tryReady

    // text selection
    function fnSelect(element) {

        fnDeSelect();

        var range;

        if (d.selection) {

            range = d.body.createTextRange();
            range.moveToElementText(element);
            range.select();

        } else if (w.getSelection) {

            range = d.createRange();
            range.selectNode(element);
            w.getSelection().addRange(range);

        }

    }

    function fnDeSelect() {

        if (d.selection) { d.selection.empty(); }
        else if (w.getSelection) { w.getSelection().removeAllRanges(); }

    }

    load();

}(window, document));