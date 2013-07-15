/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 14:37
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([
    'underscore',
    'backbone'
], function (_, Backbone) {

    var ViewEventHelper = _.extend({
    }, Backbone.Events);

    return ViewEventHelper;
});