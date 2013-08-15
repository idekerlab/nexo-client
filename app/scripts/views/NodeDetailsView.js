/**
 * Created with JetBrains WebStorm.
 * User: kono
 * Date: 2013/07/15
 * Time: 15:08
 * To change this template use File | Settings | File Templates.
 */

/*global define*/
'use strict';

define([

    'underscore',
    'backbone',
    'models/NodeDetails',
    'views/SigmaRenderer',
    'highcharts'

], function (_, Backbone, NodeDetails, SigmaRenderer) {

    var ID_SUMMARY_PANEL = '#summary-panel';

    var QUICK_GO_API = 'http://www.ebi.ac.uk/QuickGO/GTerm?id=';
    var SGD_API = 'http://www.yeastgenome.org/cgi-bin/locus.fpl?dbid=';

    var EMPTY_RECORD = 'N/A';

    var ID_NODE_DETAILS = '#details';

    var CATEGORY_MAP = {
        bp: 'Biological Process',
        cc: 'Cellular Component',
        mf: 'Molecular Function'
    };

    var TARGETS = {
        'Biological Process': '',
        'BP Annotation': 'Name',
        'BP Definition': 'Definition',
        'Cellular Component': '',
        'CC Annotation': 'Name',
        'CC Definition': 'Definition',
        'Molecular Function': '',
        'MF Annotation': 'Name',
        'MF Definition': 'Definition'
    };

    var TARGETS_GENE = {
        name: 'Gene ID',
        'Assigned Genes': 'Gene Name',
        'Assigned Orfs': 'ORF Name',
        'SGD Gene Description': 'Description'
    };

    var NodeDetailsView = Backbone.View.extend({

        el: ID_SUMMARY_PANEL,

        events: {
            'click #close-button': 'hide',
            'hover #term-summary': 'showHover',
            'hover #genes': 'showHover',
            'hover #interactions': 'showHover',

            'click #result-tab a': 'tabClicked'
        },

        isDisplayed: false,

        initialize: function () {
            this.model = new NodeDetails();
            this.listenTo(this.model, 'change', this.render);

            this.$el.find('.float-ui').hide();

//            $('#result-tab a:last').tab('show');
//            $('#result-tab a[href="#details"]').tab('show');
        },

        tabClicked: function(e) {
            console.log('********* TAB2');
            e.preventDefault();
            $(this).tab('show');
        },


        showHover: function () {
            var t = 0;
            var self = this;
            clearTimeout(t);
            this.$el.find('.float-ui').fadeIn(500);

            t = setTimeout(function () {
                self.$el.find('.float-ui').fadeOut(500);
            }, 2000);
        },

        render: function () {

            this.$(ID_NODE_DETAILS).empty();
            this.$('#genes').empty();

            var entryId = this.model.get('name');
            if (entryId.indexOf('GO') === -1) {
                this.nexoRenderer(entryId);
            } else {
                // Interaction is not available for GO
                $('#interactions').empty();
                this.goRenderer(entryId);
            }

            return this;
        },

        interactionRenderer: function (graph) {
            var edges = graph.elements.edges;

            var itrPanel = this.$('#interactions');
            itrPanel.empty();

            var summary = '<table class="table table-striped">';
            _.each(edges, function (edge) {
                var source = edge.data.source;
                var target = edge.data.target;
                var itr = edge.data.interaction;
                summary += '<tr><td>' + source + '</td><td>' + itr + '</td><td>' + target + '</td></tr>';
            });
            summary += '</table>';
            itrPanel.append(summary);
        },

        /*
         * Render term details for GO
         */
        goRenderer: function (id) {
            var label = this.model.get('term name');
            var description = this.model.get('def');
            var synonym = this.model.get('synonym');
            var comment = this.model.get('comment');

            this.renderGenes();

            this.$('#subnetwork-view').hide();
            this.$('.headertext').empty().append(label);

            var summary = '<h4><a href="' + QUICK_GO_API + id + '" target=_blank >' + id + '</a></h4>';
            summary += '<table class=\'table table-striped\'><tr><td>Description</td><td>' + description + '</td></tr>';
            summary += '<tr><td>Synonym</td><td>' + synonym + '</td></tr>';
            summary += '<tr><td>Comment</td><td>' + comment + '</td></tr>';
            summary += '</table>';

            this.$(ID_NODE_DETAILS).append(summary);
//            this.$(ID_NODE_DETAILS).append('<div id='term-view'></div>');
        },

        renderGenes: function () {
            var genes = this.model.get('Assigned Gene Ids');
            if (genes === undefined || genes.length > 100) {
                // Too many genes.
                return;
            }

            if (genes !== undefined && genes.length !== 0) {
                genes = _.uniq(genes);

                var names = '';
                _.each(genes, function (gene) {
                    names += gene + ' ';
                });

                // TODO set upper limit.
                $.getJSON('/search/names/' + names, null, function (list) {
                    var rows = {};
                    var geneNames = [];

                    var genesTab = $('#genes');
                    var table = '<table class=\'table table-striped\'>' +
                        '<tr><th>SGD ID</th><th>Gene Symbol</th><th>ORF</th></tr>';

                    _.each(list, function (gene) {
                        var symbol = gene['Assigned Genes'];
                        geneNames.push(symbol);
                        rows[symbol] = '<tr><td>' + gene.name + '</td><td><a href="' + SGD_API + gene.name + '" target=_blank>' + symbol + '</a></td><td>' + gene['Assigned Orfs'] + '</td></tr>';
                    });

                    geneNames = geneNames.sort();
                    _.each(geneNames, function (geneName) {
                        table += rows[geneName];
                    });
                    table += '</table>';
                    genesTab.append(table);

                });
            }
        },

        nexoRenderer: function (id) {

            // Use CC Annotation as label, if not available, use ID.
            var label = this.model.get('CC Annotation');
            if (label === undefined || label === null || label === '') {
                label = id;
            }

            // Main title
            this.$('.headertext').empty().append(label);

            // Render raw interaction network view
            this.$('#subnetwork-view').show();

            // Setup summary table
            this.$(ID_NODE_DETAILS).append('<div id="term-summary"></div>');

            var bestAlignedGoCategory = this.model.get('Best Alignment Ontology');
            var alignedCategory = '-';
            var category = '';
            if (bestAlignedGoCategory !== '' && bestAlignedGoCategory !== null && bestAlignedGoCategory !== 'None') {
                alignedCategory = CATEGORY_MAP[bestAlignedGoCategory];
                category = bestAlignedGoCategory.toUpperCase();
            }
            var alignedGo = this.model.get('Best Alignment GO Term ID');
            var alignedGoTermName = this.model.get('Term');
            var robustness = this.model.get('Robustness');
            var interactionDensity = this.model.get('Interaction Density');
            var bootstrap = this.model.get('Bootstrap');

            // Render Summary Table

            var summary = '<h4>Unique Term ID: ' + id + '</h4><div id="robustness"></div>';

            if (id.indexOf('S') === -1) {
                summary += '<h4>Gene Ontology Alignment</h4><table class="table table-striped">';
                summary += '<tr><td>Best Aligned GO Term ID</td><td>' + alignedGo + '</td></tr>';
                summary += '<tr><td>Best Aligned GO Term Name</td><td>' + alignedGoTermName + '</td></tr>';
                summary += '<tr><td>Best Aligned GO Gategory</td><td>';
                summary += alignedCategory + '</td></tr></table></div><div id="go-chart"></div>';
                summary = this.processEntry(summary);


                this.renderGenes();
            } else {
                summary = this.processGeneEntry(summary);
            }
            summary += '</table>';


            this.$('#term-summary').append(summary);

            if (id.indexOf('S') === -1) {
                this.renderSingleValueChart(0, 25,
                    [Math.round(robustness * 100) / 100,
                        Math.round(bootstrap * 100) / 100,
                        Math.round(interactionDensity * 100) / 100],
                    'Term Scores', ['Robustness', 'Bootstrap', 'Interaction Density'], $('#robustness'));
                this.renderScores();
            }
        },

        renderSingleValueChart: function (min, max, valueArray, title, categoryArray, domElement) {

            domElement.highcharts({
                colors: [
                    '#52A2C5',
                    '#2B7A9B',
                    '#FF5E19',
                    '#80699B',
                    '#3D96AE',
                    '#DB843D',
                    '#92A8CD',
                    '#A47D7C',
                    '#B5CA92'
                ],
                chart: {
                    type: 'bar',
                    height: 220,
                    spacingBottom: 15,
                    spacingTop: 0,
                    backgroundColor: 'rgba(255,255,255,0)'
                },


                title: {
                    text: null
                },
                xAxis: {
                    categories: [''],
                    labels: {
                        style: {
                            fontSize: '12px',
                            fontWeight: 700,
                            fontFamily: 'Roboto'
                        }
                    }
                },
                yAxis: [
                    {
                        min: min,
                        max: max,
                        title: {
                            text: 'Term Robustness',
                            style: {
                                fontFamily: 'Roboto',
                                color: '#FF5E19'
                            }
                        },
                        labels: {
                            style: {
                                fontSize: '12px',
                                fontFamily: 'Roboto',
                                color: '#FF5E19',
                                fontWeight: 300
                            }
                        },
                        opposite: true
                    },
                    {
                        min: 0,
                        max: 1,
                        title: {
                            text: 'Interaction Density & Bootstrap'
                        }
                    }
                ],
                series: [
                    {

                        yAxis: 1,
                        data: [valueArray[1]],
                        name: categoryArray[1],
                        dataLabels: {
                            enabled: true,
                            color: '#343434',
                            align: 'left',
                            x: 3,
                            y: 0,
                            style: {
                                fontWeight: 400,
                                fontSize: '12px',
                                fontFamily: 'Roboto'
                            }
                        }
                    },
                    {

                        yAxis: 1,
                        data: [valueArray[2]],
                        name: categoryArray[2],
                        dataLabels: {
                            enabled: true,
                            color: '#343434',
                            align: 'left',
                            x: 3,
                            y: 0,
                            style: {
                                fontWeight: 400,
                                fontSize: '12px',
                                fontFamily: 'Lato'
                            }
                        }
                    },
                    {

                        yAxis: 0,
                        data: [valueArray[0]],
                        name: categoryArray[0],
                        dataLabels: {
                            enabled: true,
                            color: '#FF5E19',
                            align: 'left',
                            x: 3,
                            y: 0,
                            style: {
                                fontWeight: 700,
                                fontSize: '14px',
                                fontFamily: 'Roboto'
                            }
                        }
                    }
                ],
                plotOptions: {

                    series: {
                        animation: false,
                        pointPadding: 0,
                        groupPadding: 0,
                        borderWidth: 0,
                        pointWidth: 27
                    }
                },
                credits: {
                    enabled: false
                },
                legend: {
                    enabled: true
                },
                tooltip: {
                    shared: true,
                    useHTML: true,
                    followPointer: true,
                    hideDelay: 0,
                    headerFormat: '<small>{point.key}</small><table>',
                    pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' +
                        '<td style="text-align: right"><b>{point.y}</b></td></tr>',
                    footerFormat: '</table>'
                }
            });
        },


        renderScores: function () {
            var bp = this.model.get('BP Score');
            var cc = this.model.get('CC Score');
            var mf = this.model.get('MF Score');

            bp = Math.round(bp * 100) / 100;
            cc = Math.round(cc * 100) / 100;
            mf = Math.round(mf * 100) / 100;

            $('#go-chart').highcharts({
                chart: {
                    type: 'bar',
                    animation: false,
                    height: 150,
                    spacingBottom: 15,
                    spacingTop: 0,
                    backgroundColor: 'rgba(255,255,255,0)'
                },

                title: {
                    text: null
                },
                xAxis: {
                    categories: ['Biological Process', 'Cellular Component', 'Molecular Function'],
                    labels: {
                        style: {
                            fontSize: '12px',
                            fontWeight: 300,
                            fontFamily: 'Roboto'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    max: 1.0,
                    title: {
                        text: null
                    }
                },
                series: [
                    {
                        data: [bp, cc, mf],
                        dataLabels: {
                            enabled: true,
                            color: '#343434',
                            align: 'right',
                            x: 40,
                            y: 0,
                            style: {
                                fontSize: '12px',
                                fontWeight: 700,
                                fontFamily: 'Roboto'
                            }
                        }
                    }
                ],
                plotOptions: {
                    series: {
                        animation: false,
                        pointPadding: 0,
                        groupPadding: 0,
                        borderWidth: 0,
                        pointWidth: 27
                    }
                },
                credits: {
                    enabled: false
                },
                legend: {
                    enabled: false
                }
            });
        },

        processEntry: function (allValues) {

            for (var tableKey in TARGETS) {
                var tableValue = this.model.get(tableKey);
                if (tableValue === null || tableValue === '' || tableValue === undefined) {
                    tableValue = EMPTY_RECORD;
                }

                if (tableKey === 'Best Alignment GO Term ID' && tableValue !== EMPTY_RECORD) {
                    tableValue = '<a href="' + QUICK_GO_API + tableValue + '" target="_blank">' + tableValue + '</a>';
                }

                if (tableKey === 'Biological Process' || tableKey === 'Cellular Component' || tableKey === 'Molecular Function') {
                    allValues += '</table><h4>' + tableKey + '</h4><table class=\'table table-striped\'>';
                } else {
                    allValues += '<tr><td style="width: 120px">' + TARGETS[tableKey] + '</td><td>' + tableValue + '</td></tr>';
                }
            }

            return allValues;
        },

        processGeneEntry: function (allValues) {

            allValues += '<table class=\'table table-striped\'>';
            for (var tableKey in TARGETS_GENE) {
                var tableValue = this.model.get(tableKey);
                if (tableValue === null || tableValue === '') {
                    tableValue = EMPTY_RECORD;
                }

                if (tableKey === 'name') {
                    tableValue = '<a href="' + SGD_API + tableValue + '" target="_blank">' + tableValue + '</a>';
                } else if (tableKey === 'SGD Gene Description') {
                    var descriptionList = '<ul>';
                    var entries = tableValue.split(';');
                    for (var i = 0; i < entries.length; i++) {
                        descriptionList += '<li>' + entries[i] + '</li>';
                    }
                    descriptionList += '</ul>';
                    tableValue = descriptionList;
                }
                allValues += '<tr><td style="width: 120px">' + TARGETS_GENE[tableKey] + '</td><td>' + tableValue + '</td></tr>';
            }

            return allValues;
        },

        show: function () {
            var self = this;
            this.$el.show(400, 'swing', function () {
                if (!self.isDisplayed) {
                    var newWidth = $(document).width() - 550;
                    SigmaRenderer.resize(newWidth, $(document).height()).draw();
                    SigmaRenderer.position(0, 0, 1).draw();
                    self.isDisplayed = true;
                }
            });
        },

        hide: function () {
            var self = this;
            this.$el.hide(400, 'swing', function () {
                SigmaRenderer.resize($(document).width(), $(document).height()).draw();
                SigmaRenderer.position(0, 0, 1).draw();
                self.isDisplayed = false;
            });
        }
    });

    return NodeDetailsView;
});