/*global require*/
'use strict';

require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },
        arbor: {
            deps: [
                'jquery'
            ],
            exports: 'arbor'
        },
        cytoscape: {
            deps: [
                'jquery',
                'arbor'
            ],
            exports: 'cytoscape'
        },
        highcharts: {
            exports: 'highcharts'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/jquery',
        backbone: '../bower_components/backbone-amd/backbone',
        underscore: '../bower_components/underscore-amd/underscore',
        highcharts: '../bower_components/highcharts/highcharts',
        bootstrap: 'vendor/bootstrap',
        cytoscape: '../bower_components/cytoscape.js/cytoscape',
        arbor: '../bower_components/cytoscape.js/arbor'
    }
});

require([
    'views/NexoAppView'
], function (NexoAppView) {
    new NexoAppView();
});