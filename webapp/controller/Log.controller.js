//Dynamic filters using model binding when user clicks on Execute button

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("exceluploadproject.controller.Log", {
        onInit: function () {
            var oFilterModel = new JSONModel({
                fromDate: null,
                toDate: null,
                selectedUser: "",
                selectedStatus: ""
            });
            this.getView().setModel(oFilterModel, "filterModel");

            var oLogModel = new JSONModel();
            this.getView().setModel(oLogModel, "logModel");

            this.onReadLog();
        },

        onReadLog: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oView = this.getView();

            oModel.read("/fileLog", {
                success: function (data) {
                    // ✅ Save both full data & table data
                    oView.getModel("logModel").setData({
                        fullData: data.results,
                        fileLog: data.results
                    });

                    // ✅ Extract unique dropdown values (no duplicates)
                    const uniqueUsers = [...new Set(data.results.map(item => item.user).filter(Boolean))];
                    const uniqueStatuses = [...new Set(data.results.map(item => item.status).filter(Boolean))];

                    oView.getModel("logModel").setProperty("/uniqueUsers", uniqueUsers.map(u => ({ user: u })));
                    oView.getModel("logModel").setProperty("/uniqueStatuses", uniqueStatuses.map(s => ({ status: s })));
                }.bind(this),

                error: function (oError) {
                    MessageToast.show("Error loading data");
                    console.error(oError);
                }
            });
        },

        // ✅ Called when Execute button pressed or selection changes
        onPressExecute: function () {
            this._applyFilters();
        },

        // ✅ Filter fullData locally based on selected filters
        _applyFilters: function () {
            var oView = this.getView();
            var oFilterModel = oView.getModel("filterModel");

            var oFromDate = oFilterModel.getProperty("/fromDate");
            var oToDate = oFilterModel.getProperty("/toDate");
            var sStatus = oFilterModel.getProperty("/selectedStatus");
            var sUser = oFilterModel.getProperty("/selectedUser");

            var fullData = oView.getModel("logModel").getProperty("/fullData");
            var filteredData = fullData;

            // ✅ Filter by Date Range
            if (oFromDate || oToDate) {
                filteredData = filteredData.filter(function (item) {
                    var itemDate = new Date(item.logtime);
                    var include = true;

                    if (oFromDate) include = include && (itemDate >= new Date(oFromDate));
                    if (oToDate) include = include && (itemDate <= new Date(oToDate));

                    return include;
                });
            }

            // ✅ Filter by User
            if (sUser) {
                filteredData = filteredData.filter(function (item) {
                    return item.user === sUser;
                });
            }

            // ✅ Filter by Status
            if (sStatus) {
                filteredData = filteredData.filter(function (item) {
                    return item.status === sStatus;
                });
            }

            // ✅ Update visible table data
            oView.getModel("logModel").setProperty("/fileLog", filteredData);

            MessageToast.show("Filter applied successfully");
        }
    });
});


//Dynamic filters using change function without click on Execute button

// sap.ui.define([
//     "sap/ui/core/mvc/Controller",
//     "sap/ui/model/json/JSONModel",
//     "sap/ui/model/Filter",
//     "sap/ui/model/FilterOperator",
//     "sap/m/MessageToast"
// ], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
//     "use strict";

//     return Controller.extend("exceluploadproject.controller.Log", {
//         onInit: function () {
//             var oFilterModel = new JSONModel({
//                 fromDate: null,
//                 toDate: null,
//                 selectedUser: "",
//                 selectedStatus: ""
//             });
//             this.getView().setModel(oFilterModel, "filterModel");

//             var oLogModel = new JSONModel();
//             this.getView().setModel(oLogModel, "logModel");

//             this.onReadLog();
//         },

//         onReadLog: function () {
//             var oModel = this.getOwnerComponent().getModel();
//             oModel.read("/fileLog", {
//                 success: function (data) {
//                     this.getView().getModel("logModel").setProperty("/fileLog", data.results);
//                     const uniqueUsers = [...new Set(data.results.map(item => item.user).filter(Boolean))];
//             const uniqueStatuses = [...new Set(data.results.map(item => item.status).filter(Boolean))];

//              this.getView().getModel("logModel").setProperty("/uniqueUsers", uniqueUsers.map(u => ({ user: u })));
//              this.getView().getModel("logModel").setProperty("/uniqueStatuses", uniqueStatuses.map(s => ({ status: s })));

//                 }.bind(this),
//                 error: function (oError) {
//                     MessageToast.show("Error loading data");
//                     console.error(oError);
//                 }
//             });
//         },

//         // 🔄 Called on any filter change (date or combo)
//         // onFilterChange: function () {
//         //      this._applyFilters();
//         // },

//         // _applyFilters: function () {
//         //     var oView = this.getView();
//         //     var oFilterModel = oView.getModel("filterModel");
//         //     var oModel = this.getOwnerComponent().getModel();

//         //     var sFromDate = oFilterModel.getProperty("/fromDate");
//         //     var sToDate = oFilterModel.getProperty("/toDate");
//         //     var sStatus = oFilterModel.getProperty("/selectedStatus");
//         //     var sUser = oFilterModel.getProperty("/selectedUser");

//         //     function formatDateToOData(dateValue) {
//         //         if (!dateValue) return null;
//         //         const [day, month, year] = dateValue.split("-").map(Number);
//         //         return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//         //     }

//         //     var sFrom = formatDateToOData(sFromDate);
//         //     var sTo = formatDateToOData(sToDate);

//         //     var aFilters = [];

//         //     // Build dynamic filters
//         //     if (sFrom && sTo) {
//         //         aFilters.push(new Filter("logtime", FilterOperator.BT, sFrom, sTo));
//         //     } else if (sFrom) {
//         //         aFilters.push(new Filter("logtime", FilterOperator.GE, sFrom));
//         //     } else if (sTo) {
//         //         aFilters.push(new Filter("logtime", FilterOperator.LE, sTo));
//         //     }

//         //     if (sStatus) {
//         //         aFilters.push(new Filter("status", FilterOperator.EQ, sStatus));
//         //     }

//         //     if (sUser) {
//         //         aFilters.push(new Filter("user", FilterOperator.EQ, sUser));
//         //     }

//         //     var oCombinedFilter = aFilters.length
//         //         ? new Filter({ filters: aFilters, and: true })
//         //         : null;

//         //     oModel.read("/fileLog", {
//         //         filters: oCombinedFilter ? [oCombinedFilter] : [],
//         //         success: function (data) {
//         //             oView.getModel("logModel").setProperty("/fileLog", data.results);
//         //         },
//         //         error: function (oError) {
//         //             console.error("Error applying filters:", oError);
//         //         }
//         //     });
//         // }
//         _applyFilters: function () {
//             var oView = this.getView();
//             var oFilterModel = oView.getModel("filterModel");
//             var oModel = this.getOwnerComponent().getModel();

//             var sFromDate = oFilterModel.getProperty("/fromDate");
//             var sToDate = oFilterModel.getProperty("/toDate");
//             var sStatus = oFilterModel.getProperty("/selectedStatus");
//             var sUser = oFilterModel.getProperty("/selectedUser");

//             // 🔹 Convert date from dd-MM-yyyy → yyyy-MM-dd
//             function formatDateToOData(dateValue) {
//                 if (!dateValue) return null;
//                 const [day, month, year] = dateValue.split("-").map(Number);
//                 return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//             }

//             var sFrom = formatDateToOData(sFromDate);
//             var sTo = formatDateToOData(sToDate);

//             var aFilters = [];

//             if (sFrom && sTo) {
//                 aFilters.push(new Filter("logtime", FilterOperator.BT, sFrom, sTo));
//             } else if (sFrom) {
//                 aFilters.push(new Filter("logtime", FilterOperator.GE, sFrom));
//             } else if (sTo) {
//                 aFilters.push(new Filter("logtime", FilterOperator.LE, sTo));
//             }

//             if (sStatus) {
//                 aFilters.push(new Filter("status", FilterOperator.EQ, sStatus));
//             }

//             if (sUser) {
//                 aFilters.push(new Filter("user", FilterOperator.EQ, sUser));
//             }

//             var oCombinedFilter = aFilters.length
//                 ? new Filter({ filters: aFilters, and: true })
//                 : null;

//             // 🔹 Apply the filter on Execute button click
//             oModel.read("/fileLog", {
//                 filters: oCombinedFilter ? [oCombinedFilter] : [],
//                 success: function (data) {
//                     oView.getModel("logModel").setProperty("/fileLog", data.results);
//                     MessageToast.show("Filter applied");
//                 },
//                 error: function (oError) {
//                     console.error("Error applying filters:", oError);
//                 }
//             });
//         }
//     });
// });


//Dynamic filters using odata read call by clicking on Execute button

// sap.ui.define([
//     "sap/ui/core/mvc/Controller",
//     "sap/ui/model/json/JSONModel",
//     "sap/ui/model/Filter",
//     "sap/ui/model/FilterOperator",
//     "sap/m/MessageToast"
// ], function (Controller, JSONModel, Filter, FilterOperator, MessageToast) {
//     "use strict";

//     return Controller.extend("exceluploadproject.controller.Log", {
//         onInit: function () {
//             var oFilterModel = new JSONModel({
//                 fromDate: null,
//                 toDate: null,
//                 selectedUser: "",
//                 selectedStatus: ""
//             });
//             this.getView().setModel(oFilterModel, "filterModel");

//             var oLogModel = new JSONModel();
//             this.getView().setModel(oLogModel, "logModel");

//             this.onReadLog();
//         },

//         onReadLog: function () {
//             var oModel = this.getOwnerComponent().getModel();
//             oModel.read("/fileLog", {
//                 success: function (data) {
//                     this.getView().getModel("logModel").setProperty("/fileLog", data.results);
//                     const uniqueUsers = [...new Set(data.results.map(item => item.user).filter(Boolean))];
//                     const uniqueStatuses = [...new Set(data.results.map(item => item.status).filter(Boolean))];
//                     this.getView().getModel("logModel").setProperty("/uniqueUsers", uniqueUsers.map(u => ({ user: u })));
//                     this.getView().getModel("logModel").setProperty("/uniqueStatuses", uniqueStatuses.map(s => ({ status: s })));
//                 }.bind(this),
//                 error: function (oError) {
//                     MessageToast.show("Error loading data");
//                     console.error(oError);
//                 }
//             });
//         },

//         // ✅ Execute button press
//         onPressExecute: function () {
//             this._applyFilters();
//         },

//         // ✅ Apply all dynamic filters
//         _applyFilters: function () {
//             var oView = this.getView();
//             var oFilterModel = oView.getModel("filterModel");
//             var oModel = this.getOwnerComponent().getModel();

//             var oFromDate = oFilterModel.getProperty("/fromDate");
//             var oToDate = oFilterModel.getProperty("/toDate");
//             var sStatus = oFilterModel.getProperty("/selectedStatus");
//             var sUser = oFilterModel.getProperty("/selectedUser");

//             var aFilters = [];

//             // ✅ Handle date range properly (using Date objects)
//             if (oFromDate && oToDate) {
//                 aFilters.push(new Filter("logtime", FilterOperator.BT, oFromDate, oToDate));
//             } else if (oFromDate) {
//                 aFilters.push(new Filter("logtime", FilterOperator.GE, oFromDate));
//             } else if (oToDate) {
//                 aFilters.push(new Filter("logtime", FilterOperator.LE, oToDate));
//             }

//             // ✅ Handle user & status
//             if (sUser) {
//                 aFilters.push(new Filter("user", FilterOperator.EQ, sUser));
//             }
//             if (sStatus) {
//                 aFilters.push(new Filter("status", FilterOperator.EQ, sStatus));
//             }
//              var fullData=this.getView().getModel("logModel").getProperty("/fileLog");
//             // var oCombinedFilter = aFilters.length ? new Filter(aFilters, true) : [];

//             // ✅ Perform OData read with combined filters
//             oModel.read("/fileLog", {
//                 filters: aFilters.length ? [new sap.ui.model.Filter(aFilters, true)] : [],
//                 success: function (data) {
//                     oView.getModel("logModel").setProperty("/fileLog", data.results);
//                     MessageToast.show("Filter applied successfully");
//                 },
//                 error: function (oError) {
//                     console.error("Error applying filters:", oError);
//                     MessageToast.show("Error applying filters");
//                 }
//             });
//         }
//     });
// });
