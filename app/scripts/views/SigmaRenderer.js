/*global define*/
'use strict';

define([

    'underscore',
    'backbone',
    'EventHelper',
    'sigma'

], function(_, Backbone, EventHelper, sigma) {

    console.log(EventHelper);
    console.log(sigma);

    var SigmaRenderer = sigma.init(document.getElementById('sigma-canvas'));
//    SigmaRenderer = _.extend(SigmaRenderer, Backbone.Events);
//
//    SigmaRenderer.prototype = {
//
//        clear: function() {
//            console.log('=========== CLEAR called =============');
//        }
//    };
//
//    console.log("SIGMA registering-----------------");
//    //SigmaRenderer.listenTo(EventHelper, EventHelper.NETWORK_LOADED, _.bind(SigmaRenderer, SigmaRenderer.clear));

    return SigmaRenderer;
});