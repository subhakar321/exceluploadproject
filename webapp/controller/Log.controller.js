sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (BaseController, JSONModel) => {
    "use strict";

    return BaseController.extend("exceluploadproject.controller.Log", {
        onInit() {
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
            oModel.read("/fileLog", {
                success: function (data) {
                    this.getView().getModel("logModel").setProperty("/fileLog", data.results);
                    // sap.m.MessageToast.show("Record created successfully!");
                    // console.log("Response:", data);
                }.bind(this),
                error: function (oError) {
                    sap.m.MessageToast.show(oError.message);
                    console.error("Error details:", oError);
                }
            });
        },
        onPressExecute: function () {
    var oView = this.getView();
    var oFilterModel = oView.getModel("filterModel");
    var oModel = this.getOwnerComponent().getModel();

    var sFromDate = oFilterModel.getProperty("/fromDate");
    var sToDate = oFilterModel.getProperty("/toDate");
    var sStatus = oFilterModel.getProperty("/selectedStatus");
    var sUser = oFilterModel.getProperty("/selectedUser");

    // Format date to yyyy-MM-dd (OData-compliant)
    function formatDateToOData(dateValue) {
    if (!dateValue) return null;

    // Input format expected: "dd-MM-yyyy"
    const [day, month, year] = dateValue.split("-").map(Number);

    // Return as "yyyy-MM-dd"
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}


    var sFrom = formatDateToOData(sFromDate);
    var sTo = formatDateToOData(sToDate);

    // Build filters dynamically
    var aFilters = [];

    // Only push filters if logtime actually exists in the backend
    if (sFrom && sTo) {
        aFilters.push(
            new sap.ui.model.Filter({
                path: "logtime",
                operator: sap.ui.model.FilterOperator.BT,
                value1: sFrom,
                value2: sTo
            })
        );
    } else if (sFrom) {
        aFilters.push(new sap.ui.model.Filter("logtime", sap.ui.model.FilterOperator.GE, sFrom));
    } else if (sTo) {
        aFilters.push(new sap.ui.model.Filter("logtime", sap.ui.model.FilterOperator.LE, sTo));
    }

    if (sStatus) {
        aFilters.push(new sap.ui.model.Filter("status", sap.ui.model.FilterOperator.EQ, sStatus));
    }

    if (sUser) {
        aFilters.push(new sap.ui.model.Filter("user", sap.ui.model.FilterOperator.EQ, sUser));
    }

    // Combine all with AND only if more than one filter exists
    var oCombinedFilter = aFilters.length >= 1
        ? new sap.ui.model.Filter({ filters: aFilters, and: true })
        : aFilters[0] || [];

    oModel.read("/fileLog", {
        filters: aFilters.length ? [oCombinedFilter] : [],
        success: function (data) {
            oView.getModel("logModel").setProperty("/fileLog", data.results);
            sap.m.MessageToast.show("Filtered data loaded successfully!");
            console.log("Filtered Data:", data.results);
        },
        error: function (oError) {
            console.error("Error while fetching filtered data:", oError);
            sap.m.MessageToast.show("Error fetching filtered data");
        }
    });
}

    });
});