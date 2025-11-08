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
], function (Controller, JSONModel, MessageToast, ColumnListItem, Input, deepExtend, CheckBox) {
    "use strict";

    return Controller.extend("exceluploadproject.controller.uploadView", {

        onInit: function () {
            this._bEditMode = false;


            var oViewModel = new JSONModel({
                bEditMode: false,
                editButtonText: "Edit"
            });
            if (typeof XLSX === "undefined") {
                sap.ui.require(["sap/ui/thirdparty/jquery"], function () {
                    // Load XLSX dynamically if missing
                    $.getScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
                });
            }
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
        userinfo: function () {

        },
        onReadCSV: function () {
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
        onExcelUpload: async function (oEvent) {
            var oFile = oEvent.getParameter("files")[0];
            if (!oFile) {
                MessageToast.show("Please choose an Excel file.");
                return;
            }
             if (typeof XLSX === "undefined") {
                await new Promise((resolve, reject) => {
                    $.getScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js")
                        .done(resolve)
                        .fail(() => reject("Failed to load XLSX library"));
                });
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

                var oNow = new Date();
                var sUploadDate = oNow.toLocaleDateString(); // e.g., 11/8/2025
                var sUploadTime = oNow.toLocaleTimeString(); // e.g., 16:45:32
                var slogtime = oNow.toISOString();         // e.g., 2025-11-08T11:15:20.123Z

                // Add logtime info to each record (optional)
                jsonData.forEach(obj => {
                    obj.uploadDate = sUploadDate;
                    obj.uploadTime = sUploadTime;
                    obj.uploadlogtime = slogtime;
                    obj.fileName = oFile.name;
                });

                // Store data in model
                var oModel = this.getView().getModel("TableModel");
                oModel.setProperty("/excelRows", jsonData);

                // Also store upload summary (optional)
                oModel.setProperty("/uploadInfo", {
                    fileName: oFile.name,
                    fileSize: (oFile.size / 1024).toFixed(2) + " KB",
                    uploadedAt: slogtime,
                    recordCount: jsonData.length
                });

                sap.m.MessageToast.show("Excel loaded successfully at " + sUploadTime);
            }.bind(this);

            reader.readAsArrayBuffer(oFile);
        },

      onSaveToHana: async function () {
    var oFileUploader = this.byId("excelUploader");
    var oFile = oFileUploader.oFileUpload ? oFileUploader.oFileUpload.files[0] : null;

    // 🔹 Check file selection
    if (!oFile) {
        sap.m.MessageToast.show("Please select a file before saving.");
        return;
    }

    var oModel = this.getOwnerComponent().getModel();
    var aData = this.getView().getModel("TableModel").getProperty("/excelRows");
    var sFileName = this.getView().getModel("TableModel").getProperty("/uploadInfo/fileName");
    var sUser = "subhakar";
    var sStatus = "Success";
    var sLogTime = new Date().toISOString();
    var sFailureReason = "";

    // 🔹 Validate Excel data
    var bInvalid = aData.some(row =>
        !row.name || !row.place || row.name.trim() === "" || row.place.trim() === ""
    );

    if (bInvalid) {
        sStatus = "Failure";
        sFailureReason = "Missing Name or Place in one or more rows. Upload cancelled.";
        sap.m.MessageToast.show("Upload failed: " + sFailureReason);

        // Log failure
        const oFailLogPayload = {
            filename: sFileName,
            user: sUser,
            status: sStatus,
            logtime: sLogTime.split("T")[0]
        };

        await new Promise((resolve, reject) => {
            oModel.create("/fileLog", oFailLogPayload, {
                success: function () {
                    // console.log("Log failed:", oLogPayload);
                    resolve();
                    oModel.refresh();
                },
                error: reject
            });
        });

        this.getOwnerComponent().getRouter().navTo("Log");
        return;
    }

    try {
        // 🔹 Call CAP function for bulk upload
        await new Promise((resolve, reject) => {
            oModel.callFunction("/uploadExcelData", {
                method: "GET", // because CDS function
                urlParameters: {
                    data: JSON.stringify(aData),
                    fileName: sFileName,
                    user: sUser,
                    status: sStatus,
                    logtime: sLogTime.split("T")[0]
                },
                success: function (oData) {
                    console.log("Function success:", oData);
                    sap.m.MessageToast.show("Excel data uploaded successfully!");
                    resolve();
                   oModel.refresh();
                },
                error: function (oError) {
                    console.error("Function error:", oError);
                    sap.m.MessageToast.show("Error uploading Excel data!");
                    sStatus = "Failure";
                    reject(oError);
                }
            });
        });

        // 🔹 Success log entry
        const oLogPayload = {
            filename: sFileName,
            user: sUser,
            status: sStatus,
            logtime: sLogTime.split("T")[0]
        };

        await new Promise((resolve, reject) => {
            oModel.create("/fileLog", oLogPayload, {
                success: function () {
                    console.log("Log created:", oLogPayload);
                    resolve();
                    oModel.refresh();
                },
                error: function (err) {
                    console.error("Error creating log:", err);
                    reject(err);
                }
            });
        });

        // Navigate to log view
        this.getOwnerComponent().getRouter().navTo("Log");

    } catch (e) {
        console.error("Upload Exception:", e);
        sap.m.MessageToast.show("Unexpected error during upload.");
    }
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
        onCancel: function () {
            // this.byId("cancelButton").setVisible(false);
            // this.byId("saveButton").setVisible(false);
            // this.byId("editButton").setVisible(true);
            var newTABDATA = this.getView().getModel("csvModel").getProperty("/csvRows");
            this.getView().getModel("csvModel").setProperty("/csvRows", newTABDATA);
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
