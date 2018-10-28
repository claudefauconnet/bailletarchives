var dataTable = function () {


    this.dataSet = [];
    this.columns = [];
    this.table;
    this.selectedRow;
    self.dateColumns = []

    this.loadJson = function (containerDiv, json, options) {

        if (!options)
            options = {};

        height = 500;
        this.dataSet = [];
        this.columns = [];


        this.dataSet = json
        ;
        var keys = []
        json.forEach(function (line, index) {
            for (var key in line) {
                if (keys.indexOf(key) < 0)
                    keys.push(key);
            }
        })
        var columns = [];
        self.dateColumns = [];
        keys.forEach(function (key, index) {
            var type = mainController.getFieldType(this.table, key);

            var obj = {data: key, title: key};
            if (type == "date") {
                self.dateColumns.push(index);
            }
            columns.push(obj)
        })

        this.columns = columns;
        var htmlStr = "<table style=' z-index:100 ' id='table_" + containerDiv + "'  class='myDatatable cell-border display nowrap'></table>"

        var xxx = $("#" + containerDiv).html();
        $("#" + containerDiv).html(htmlStr);
        $('#' + containerDiv).css("font-size", "10px");

        var height = $(".dataTableDiv").height() - (mainController.leftPanelWidth + 50);
        var width = $(".dataTableDiv").width() - 280;
        $("#table_" + containerDiv).width("400px").height(height);

        var table = $("#table_" + containerDiv).DataTable({
            //  dom: 'Blfrtip',
            "dom": '<"top"firptl><"bottom"B><"clear">',

            buttons: [
                'copy', 'csv', 'print'
                // 'copy', 'csv', 'excel', 'pdf', 'print'
            ],
            data: this.dataSet,
            columns: columns,


            "columnDefs": [
                {//dates
                    "render": function (data, type, row) {
                        var str = "";
                        if (data != null && data != "" && data.indexOf("0000") < 0) {
                            var date = new Date(data);
                            str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
                        }
                        return str;

                    },
                    "targets": self.dateColumns
                }

            ],
            select: {
                style: 'os',
                selector: 'td:first-child'
            },

            // pageLength: 10,
            "pager": true,

            "scrollY": "" + height + "px",
            "scrollX": "" + width + "px",

            // "pagingType": "scrolling"

            /*   scrollX: true,
              scrollY: height - 100,
              fixedColumns: {
                  heightMatch: 'none'
              },
             dom: 'Bfrtip',
              buttons: [
                  //'copyHtml5',
                  'excelHtml5',
                  'csvHtml5',
                  'pdfHtml5'
              ]*/
        })
        /*   table.buttons().container()
               .appendTo( $('.col-sm-6:eq(0)', table.table().container() ) );*/
        this.table = table;

        $('#table_' + containerDiv + ' tbody').on('click', 'tr', function (event) {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                $("#table_" + containerDiv + " tbody tr").css("height", "20px");
            }
            else {
                if (!event.ctrlKey)
                    $('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                if (options.onClick) {

                    var px = event.clientX;
                    var py = event.clientY;
                    this.selectedRow = table.row(this);
                    var line = table.row(this).data();
                    /*  var idx = table.cell('.selected', 0).index();
                      // var data = table.row( idx.row ).data();
                      var line = this.dataSet[idx.row];*/

                    options.onClick(line);
                    // recordController.displayRecordData(line);
                    $(dialog.dialog("open"))
                }


            }

        });


    },

        this.updateSelectedRow = function (obj) {
            var rowIndex = this.table.rows('.selected').indexes()[0];
            var table = this.table;
            for (var key in recordController.currentRecordChanges) {
                this.columns.forEach(function (column, colIndex) {
                    if (column.data == key) {
                        table.cell(rowIndex, colIndex).data(recordController.currentRecordChanges[key]).draw();
                    }
                })

                var x = "";

            }


        }


}
