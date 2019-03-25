var dataTable = function () {


    this.dataSet = [];
    this.columns = [];
    this.table;
    this.selectedRow;
    self.dateColumns = [];
    self.numberColumns = [];
    this.pageLength = 100;
    this.colHeight = 80;

    this.dataTableSortArray=[];



    this.getColumns=function(json,table, definedColumns){
        this.table = table
      var columns = [];
        var keys = [];

        if (config.tableDefs[table] && config.tableDefs[table].sortFields)
            sortColumns = config.tableDefs[table].sortFields;


        if(definedColumns){

            definedColumns.forEach(function(column){
                keys.push(column)
            })
        }else {
            json.forEach(function (line, index) {
                for (var key in line) {
                    if (keys.indexOf(key) < 0 && config.listHiddenFields.indexOf(key) < 0)
                        keys.push(key);
                }
            })
        }
        var columns = [];
        self.dateColumns = [];
        self.numberColumns = [];
        var sortColumns = [];
        var textColumns=[];
        keys.forEach(function (key, index) {
            var type = mainController.getFieldType(table, key);

            var obj = {data: key, title: key, width: "100px"};
            if (type == "date") {
                self.dateColumns.push(index);
            }
            if (type == 'number') {
                self.numberColumns.push(index);
            }

            if(mainController.isTextField(table, key)) {
                obj.width=400;

                textColumns.push(index)
            }

            columns.push(obj);


            //sort datatable
            if (sortColumns.length > 0 && sortColumns[0].indexOf(key) > -1) {
                var order = sortColumns[0].indexOf("desc") > -1;
                if (order)
                    order = "desc"
                else
                    order = "asc"

             //   this.dataTableSortArray.push([index, order])
            }
        })

        columns.sortColumns=sortColumns;
        columns.dateColumns=self.dateColumns;
        columns.numberColumns=self.numberColumns;
        columns.textColumns=textColumns;
        this.columns = columns
        return columns;

    }
    this.loadJson = function (table, containerDiv, json, options) {
        this.table = table
        if (!options)
            options = {};

        this.dataSet = json

        this.columns = this.getColumns(json,table);
        var widthStr = "";
        var heightStr = ""
        if (options.width)
            widthStr = "width:" + options.width + "px;"
        if (options.height)
            heightStr = "height:" + options.height + "px;"






        var htmlStr = "";
        if (options.title)
            htmlStr = "<div class='title'>" + options.title + "</div>"
        htmlStr += "<table style='z-index:100;" + widthStr + heightStr + " ' id='table_" + containerDiv + "'  class='myDatatable cell-border display nowrap' ></table>"

        $("#" + containerDiv).html(htmlStr);
        $('#' + containerDiv).css("font-size", "10px");

        var height = $("#" + containerDiv).height() - 150


        /*   $('#' + containerDiv).width(500);

           $('#' + containerDiv).css("overflow","auto");*/


        var dom = '<"top"firptl><"bottom"B><"clear">'
        if (typeof options.dom !== 'undefined' && options.dom !== null)
            dom = options.dom;

        $("div.dataTables_wrapper").css("width","600px").css("height","200px")

        var fixedColumns=true;
        if(options.noFixedColumns)
            fixedColumns=false;




        var table = $("#table_" + containerDiv).DataTable({
            //  responsive: true,
            fixedHeader: true,
            "dom": dom,
            "autoWidth": false,
            buttons: [
                'copy', 'csv', 'print'
                // 'copy', 'csv', 'excel', 'pdf', 'print'
            ],
            data: this.dataSet,
            columns: this.columns,
            "order": this.dataTableSortArray,


            scrollY: height,
            scrollX: true,
          //  scrollCollapse: true,
            paging: true,
            pageResize: true,
            pageLength: this.pageLength,
            "pager": true,


            "columnDefs": [
                {width: 100, targets: 0},
                {//dates
                    "render": function (data, type, row, meta) {
                        var str = "";
                        if (data != null && data != "" && data.indexOf("0000") < 0) {

                            var date = new Date(data);
                            str = util.dateToStringFR(date);
                        }
                        return str;
                    },
                    "targets": self.dateColumns
                },
                {//number
                    "render": function (data, type, row, meta) {
                        var str = "";
                        if (data != null && config.locale == "FR") {
                            str = ("" + data).replace(".", ",")
                        }
                        return str;

                    },
                    "targets": self.numberColumns
                }

            ],
         fixedColumns: fixedColumns,
            select: {
                style: 'os',
                selector: 'td:first-child'
            },
            drawCallback: function (settings, json) {
                $(".dataTables_scrollHeadInner").css({"width":"100%"});

                $(".table ").css({"width":"100%"});
            }


        })

        table.columns.adjust().draw();
        table.sqlTable=table;



        this.table = table;

        $('#table_' + containerDiv + ' tbody').on('click', 'tr', function (event) {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                $("#table_" + containerDiv + " tbody tr").css("height", "20px");
            }
            //  else {
            if (!event.ctrlKey)
                $('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            if (options.onClick) {

                var px = event.clientX;
                var py = event.clientY;
                this.selectedRow = table.row(this);
                var line = table.row(this).data();
                options.onClick(line);

            }


            // }

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
    this.deleteSelectedRow = function () {
        var xx = this.table.row('.selected')
        this.table.row('.selected').remove().draw();

    }


}
