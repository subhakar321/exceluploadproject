/*global QUnit*/

sap.ui.define([
	"exceluploadproject/controller/uploadView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("uploadView Controller");

	QUnit.test("I should test the uploadView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
