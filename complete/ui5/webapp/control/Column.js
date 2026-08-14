sap.ui.define([
	'sap/m/Column'
], function(Column) {
	'use strict';

	/**
	 * Custom Column control.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class Column
	 * The fi.neomore.template.control.Column control provides few extra properties to be used with with fi.neomore.template.control.Table
	 *
	 * @extends sap.m.Column
	 *
	 * @author Neomore Consulting Oy - Jyri Jaakkola
	 * @version 1.0
	 *
	 * @constructor
	 * @public
	 * @since 1.38
	 * @alias fi.neomore.template.control.Column
	 */

	var ControlColumn = Column.extend('fi.neomore.template.control.Column', {
		metadata: {
			/**
             * Extended metadata properties for fi.neomore.template.control.Column.
             * @name fi.neomore.template.control.Column#properties
             * @property {string} [sortKey = ''] - {@link fi.neomore.template.control.Column#sortKey Sort key}
             * @property {string} [searchKey = ''] - {@link fi.neomore.template.control.Column#searchKey Search key}
             * @property {string} [isNumeric = false] - {@link fi.neomore.template.control.Column#isNumeric Is Numeric}
             * @property {string} [isDate = false] - {@link fi.neomore.template.control.Column#isDate Is Date}
             * @property {string} [dateFormat = 'dd.MM.yyyy'] - {@link fi.neomore.template.control.Column#dateFormat Date Format}
             */
			properties: {
				/**
                 * Defines key of the to check against binded items data in the fi.neomore.template.control.Table
				 * @name fi.neomore.template.control.Column#sortKey
                 */
				sortKey: {
					type: 'string',
					defaultValue: ''
				},
				/**
                 * Defines key of the to check against binded items data in the fi.neomore.template.control.Table
				 * @name fi.neomore.template.control.Column#searchKey
                 */
				searchKey: {
					type: 'string',
					defaultValue: ''
				},
				/**
                 * Defines if the sort key is numeric for sorting fi.neomore.template.control.Table
				 * @name fi.neomore.template.control.Column#isNumeric
                 */
				isNumeric: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                 * Defines if the search key is date value for filtering fi.neomore.template.control.Table
				 * @name fi.neomore.template.control.Column#isDate
                 */
				isDate: {
					type: 'boolean',
					defaultValue: false
				},
				/**
                 * Defines date format used to make date searchable for filtering fi.neomore.template.control.Table
				 * @name fi.neomore.template.control.Column#dateFormat
                 */
				dateFormat: {
					type: 'string',
					defaultValue: 'dd.MM.yyyy'
				}
			}
		}
	});

	return ControlColumn;
});