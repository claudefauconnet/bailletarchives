var dataTable = function () {


    this.dataSet = [];
    this.columns = [];
    this.table;
    this.selectedRow;

    this.loadJson = function (containerDiv, json, options) {

        if (!options)
            options = {};

        height = 500;
        this.dataSet = [];
        this.columns = [];


        this.dataSet = json
        ;
        var keys = []
        json.forEach(function (line) {
            for (var key in line) {
                if (keys.indexOf(key) < 0)
                    keys.push(key);
            }
        })
        var columns = []
        keys.forEach(function (key) {
            columns.push({data: key, title: key})
        })

        this.columns = columns;
        var htmlStr = "<br><br><br></div><table style=' z-index:100 ' id='table_" + containerDiv + "'  class='myDatatable cell-border display nowrap'></table>"

        var xxx = $("#" + containerDiv).html();
        $("#" + containerDiv).html(htmlStr);
        $('#' + containerDiv).css("font-size", "10px");
      //  $('#table_' + containerDiv).css("font-size", "10px");

       // table_listRecordsDiv_wrapper


        var height = $("#table_" + containerDiv).height() - 200
        $("#table_" + containerDiv).width("400px").height(height);

       var  table= $("#table_" + containerDiv).DataTable({
            data: this.dataSet,
            columns: columns,
           "pageLength": 15
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
        this.table=table;

        $('#table_' + containerDiv + ' tbody').on('click', 'tr', function (event) {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                $("#table_" + containerDiv + " tbody tr").css("height", "20px");
            }
            else {
                if (options.onClick ) {
                    $('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                    var px = event.clientX;
                    var py = event.clientY;
                    this.selectedRow=table.row(this);
                    var line= table.row( this ).data();
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

        this.updateSelectedRow=function(obj){
            var rowIndex  = this.table.rows( '.selected' ).indexes()[0];
            var table=this.table;
            for (var key in recordController.currentRecordChanges) {
                this.columns.forEach(function(column,colIndex){
                    if(column.data==key) {
                        table.cell(rowIndex,colIndex).data(recordController.currentRecordChanges[key]).draw();
                    }
                })

                var x = "";

            }


        }



}

