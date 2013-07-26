/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 15:39
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([

    'underscore',
    'backbone'

], function (_, Backbone) {

    var SearchView = Backbone.View.extend({

        render: function (query) {
            var self = this;

            var name = this.model.get('name');
            var label = this.model.get('label');
            var hits = {};
            _.each(this.model.keys(), function (key) {
                var value = self.model.get(key);
                if (value !== undefined && value !== '' && key !== 'label') {
                    _.each(query, function (qVal) {
                        var original = value.toString();
                        var newValue = original.toLocaleLowerCase();
                        var location = newValue.indexOf(qVal.toLowerCase());
                        if (location !== -1) {
                            var len = original.length;
                            var start = 0;
                            var last = len;

                            if (location > 20) {
                                start = location - 20;
                            }

                            if (len - location > 20) {
                                last = location + 20;
                            }

                            var finalText = '';
                            if (start !== 0) {
                                finalText += '... ';
                            }

                            finalText += original.substring(start, last);

                            if (last !== len) {
                                finalText += '...';
                            }

                            hits[key] = finalText;
                        }
                    });
                }
            });

            var newRow = '<tr><td>' + name + '</td><td>' + label + '</td><td style="width: 190px"><ul>';
            _.each(_.keys(hits), function (key) {
                newRow += '<li>' + hits[key] + '</li>';
            });

            newRow += '</ul></td></tr>';
            this.$el.append(newRow);
            return this;
        }
    });
    return SearchView;
});