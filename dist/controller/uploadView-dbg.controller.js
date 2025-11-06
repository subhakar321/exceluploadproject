// sap.ui.define([
//     "sap/ui/core/mvc/Controller"
// ], (Controller) => {
//     "use strict";

//     return Controller.extend("exceluploadproject.controller.uploadView", {
//         onInit() {
//         }
//     });
// });

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
     'sap/m/ColumnListItem',
    'sap/m/Input',
    'sap/base/util/deepExtend',
    'sap/m/CheckBox'
], function (Controller, JSONModel, MessageToast,ColumnListItem, Input,deepExtend, CheckBox ) {
    "use strict";

    return Controller.extend("exceluploadproject.controller.uploadView", {

        onInit: function () {
            this._bEditMode = false;
           

            var oViewModel = new JSONModel({
                bEditMode: false,
                editButtonText: "Edit"
            });
             this.getView().setModel(oViewModel, "view");
            this.getView().setModel(new JSONModel({ excelRows: [] }), "TableModel");
            var newModel = new JSONModel();
            this.getView().setModel(newModel, "csvModel")
           this.onReadCSV();
           this.oTable = this.byId("idCSVTable");
            this.oReadOnlyTemplate = this.byId("idCSVTable").getBindingInfo("items").template.clone();
            this.rebindTable(this.oReadOnlyTemplate, "Navigation");
            this.oEditableTemplate = new ColumnListItem({
                cells: [
                    new Input({
                        value: "{csvModel>id}"
                    }), new Input({
                        value: "{csvModel>name}",
                        editable: "{= ${csvModel>selected} }" 

                    }), new Input({
                        value: "{csvModel>place}",
                        editable: "{= ${csvModel>selected} }" 
                    }), new CheckBox({
                        selected: "{csvModel>selected}"
                    })
                ]
            });
        },
        onReadCSV: function(){
               var oModel = this.getOwnerComponent().getModel();
            oModel.read("/CsvRows", {
                success: function (data) {
                    this.getView().getModel("csvModel").setProperty("/csvRows", data.results);
                    // sap.m.MessageToast.show("Record created successfully!");
                    // console.log("Response:", data);
                }.bind(this),
                error: function (oError) {
                    sap.m.MessageToast.show(oError.message);
                    console.error("Error details:", oError);
                }
            });
        },
        onExcelUpload: function (oEvent) {
            var oFile = oEvent.getParameter("files")[0];
            if (!oFile) {
                MessageToast.show("Please choose an Excel file.");
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, { type: "array" });

                // Read first sheet
                var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                var jsonData1 = XLSX.utils.sheet_to_json(firstSheet);
                var jsonData2 = jsonData1.map(obj =>
                    Object.fromEntries(
                        Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
                    )
                );
                var jsonData = jsonData2.map(obj =>
                    Object.fromEntries(
                        Object.entries(obj).map(([key, value]) => [key.replace(/\s+/g, ''), value])
                    )
                );

                // Expected column names: name, place
                this.getView().getModel("TableModel").setProperty("/excelRows", jsonData);
                MessageToast.show("Excel loaded successfully!");
            }.bind(this);

            reader.readAsArrayBuffer(oFile);
        },

        onSaveToHana: function () {
            var oModel = this.getOwnerComponent().getModel(); // OData model
            var aData = this.getView().getModel("TableModel").getProperty("/excelRows");

            aData.forEach(function (row) {
                var payload = {
                    name: row.name,
                    place: row.place
                };

                oModel.create("/CsvRows", payload, {
                    success: function () {
                        console.log("Created:", payload);
                    },
                    error: function (err) {
                        console.error("Error creating record:", err);
                    }
                });
            });

            MessageToast.show("Data sent to backend!");
        },
        // onEdit: function () {
        //     this._bEditMode = false;

        //     var oViewModel = new JSONModel({
        //         bEditMode: false,
        //         editButtonText: "Edit"
        //     });
        //     this.getView().setModel(oViewModel, "view");
        //     var aRows = this.getView().getModel("csvModel").getProperty("/csvRows");
        //     var oTable = this.byId("idCSVTable");
        //     aRows.forEach(function (row) {
        //         if (row.name === "Ravi111") {
        //             row.selected = true; // enable checkbox
        //         } else {
        //             row.selected = false; // optional: uncheck others
        //         }
        //     });

        //     // Update model back to reflect changes
        //     this.getView().getModel("csvModel").setProperty("/csvRows", aRows);

        //     // Optional: Switch table to editable mode

        //     oTable.setMode("MultiSelect");
        // }
         rebindTable: function (oTemplate, sKeyboardMode) {
            this.oTable.bindItems({
                path: "csvModel>/csvRows",
                template: oTemplate,
                templateShareable: true,
                key: "csvModel>id"
            }).setKeyboardMode(sKeyboardMode);
        },
        onEdit: function () {
            var oViewModel = this.getView().getModel("view");
            var oCsvModel = this.getView().getModel("csvModel");
            var aRows = oCsvModel.getProperty("/csvRows");

            // Toggle edit mode
            this._bEditMode = !this._bEditMode;
            oViewModel.setProperty("/bEditMode", this._bEditMode);
            oViewModel.setProperty("/editButtonText", this._bEditMode ? "Cancel Edit" : "Edit");

            if (this._bEditMode) {
                // Enable edit mode and auto-select Ravi111
                aRows.forEach(function (row) {
                    // if (row.name === "Ravi111") {
            row.selected = (row.name === "Ravi111");  // ✅ enable checkbox
        } 
                    // row.selected = (row.name === "Ravi111");
                );
                MessageToast.show("Edit mode enabled");
            } else {
                // Cancel edit mode
                aRows.forEach(function (row) {
                    row.selected = false;
                });
                MessageToast.show("View mode enabled");
            }

            oCsvModel.setProperty("/csvRows", aRows);
            this.aProductCollection = deepExtend([], this.getView().getModel("csvModel").getProperty("/csvRows"));
            // this.byId("editButton").setVisible(false);
            // this.byId("saveButton").setVisible(true);
            // this.byId("cancelButton").setVisible(true);
            this.rebindTable(this.oEditableTemplate, "Edit");
        },
        	onCancel: function() {
			// this.byId("cancelButton").setVisible(false);
			// this.byId("saveButton").setVisible(false);
			// this.byId("editButton").setVisible(true);
			var newTABDATA=this.getView().getModel("csvModel").getProperty("/csvRows");
            this.getView().getModel("csvModel").setProperty("/csvRows",newTABDATA);
			this.rebindTable(this.oReadOnlyTemplate, "Navigation");
		},
        onSave: function () {
    // this.byId("saveButton").setVisible(false);
    // this.byId("cancelButton").setVisible(false);
    // this.byId("editButton").setVisible(true);

    var oODataModel = this.getOwnerComponent().getModel();  // <-- OData V2 Model
    var aUpdatedRows = this.getView().getModel("csvModel").getProperty("/csvRows");

    // Loop through each row to update individually
    aUpdatedRows.forEach(function (oRow) {
        // Construct the OData entity path — assuming 'id' is your key
        var sPath = "/CsvRows(" + oRow.id + ")";

        // Payload (exclude the id if backend auto-generates it)
        var oPayload = {
            name: oRow.name,
            place: oRow.place
        };

        oODataModel.update(sPath, oPayload, {
            success: function () {
                console.log("Record " + oRow.id + " updated successfully");
            },
            error: function (oError) {
                console.error("Error updating record " + oRow.id, oError);
                sap.m.MessageToast.show("Update failed for record " + oRow.id);
            }
        });
    });

    // Refresh the table after updates
     this.onReadCSV();

    sap.m.MessageToast.show("All records updated successfully!");
    this.rebindTable(this.oReadOnlyTemplate, "Navigation")
        }


    });
});
