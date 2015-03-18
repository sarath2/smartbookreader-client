mainApp.controller('adminCtrl', function ($scope, $rootScope, $location, adminService, ngTableParams, $filter,userService,categoryService,analysisService,utilityService) {
    //read gDrive
    $scope.search = {
        userText: ""
    };
    $scope.filterTable = function () {
        $scope.userInfosTable.isReload = false;
        $scope.userInfosTable.reload();
        $scope.userInfosTable.page(1);
    };
    adminService.userInfo(function (info) {
        _.forEach(info, function (data) {
            data.activity = data.activity ? data.activity : 0;
            data.quiz_taken = data.quiz_taken ? data.quiz_taken : 0;
        });
        $scope.userInfosTable = new ngTableParams({
            page: 1, // show first page
            count: 25 // count per page
        }, {
            total: info.length, // length of info data
            getData: function ($defer, params) {
                var filteredData = $scope.search.userText ? $filter('filter')(info, $scope.search.userText) : info;

                var orderedData = params.sorting() ?
                    $filter('orderBy')(filteredData, params.orderBy()) :
                    info;

                var paginateData = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());

                params.total(orderedData.length); // set total for recalc pagination
                if (params.total() < (params.page() - 1) * params.count()) {
                    params.page(1);
                }
                $defer.resolve(paginateData);
                //$defer.resolve(info= orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
        });
    });


    //from db

    $scope.chartConfig = {};

    $scope.chartConfig.timeSpentByDates = {
        options: {
            chart: {
                type: 'spline'
            }
        },
        title: {
            text: ''
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e. %b',
                year: '%b'
            }
        },
        yAxis: {
            title: {
                text: 'Time Spent (mins)'
            },
            labels: {
                formatter: function () {
                    return Math.floor(this.value / 60) + '';
                }
            },
            min: 0
        },
        tooltip: {
            formatter: function () {
                return 'Time spent on ' + Highcharts.dateFormat('%e. %b', this.x) + ': <b>' + Math.round((this.y / 60)) + ' mins</b>';
            }
        },
        series: [{
            name: 'Total time spent on each day',
            data: []
        }]
    };

    $scope.chartConfig.timeSpentByBooks = {
        options: {
            chart: {
                type: 'column'
            }
        },
        title: {
            text: ''
        },
        xAxis: {
            categories: [],
            labels: {
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Time Spent (minutes)'
            },
            labels: {
                formatter: function () {
                    return Math.floor(this.value / 60) + '';
                }
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {

            formatter: function () {
                return this.x + '<br/>Total time spent: <b>' + Math.round((this.y / 60)) + ' mins</b>';
            }
        },
        series: [{
            name: 'Time Spent',
            data: []
        }]
    };


    $scope.chartConfig.mostPopularCategories = {
        options: {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            }
        },
        title: {
            text: ''
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    color: '#000000',
                    connectorColor: '#000000',
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        series: [{
            type: 'pie',
            name: '',
            data: [
                ['Fiction ', 35.3],
                ['Nonfiction', 15.7],
                ['Literature', 25.2],
                ['Children', 13],
                ['Others', 10.8]
            ]
        }]
    };
    // get user activity
    userService.activity(function (result) {

        $scope.activities = result;

        var activities = result;
        var stats = analysisService.getBookStats(activities);
        var readingActivity = analysisService.getReadingActivityByDates(stats);

        // init Total Time Spent By Dates
        $scope.chartConfig.timeSpentByDates.series[0].data = utilityService.convertToHighChartDatePair(readingActivity);

        // init Total Time Spent By Books chart
        $scope.chartConfig.timeSpentByBooks.xAxis.categories = JSPath.apply('.bookName', stats);
        $scope.chartConfig.timeSpentByBooks.series[0].data = JSPath.apply('.totalTimeSpent', stats);

    });

    // get trending categories
    categoryService.getTrendingCategories(function (result) {
        var categories = _.pluck(result, 'category');
        var data = _.pluck(result, 'count');
        var chartTrendingCategory = new Highcharts.Chart({

            chart: {
                renderTo: 'chartTrendingCategory',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: categories,
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of books'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Books',
                data: data
    }]

        });
    });
    // get number of users for each categories
    categoryService.usersForCategories(function (result) {
        var categories = _.pluck(result, 'category');
        var data = _.pluck(result, 'count');
        var chartUsersForCategory = new Highcharts.Chart({

            chart: {
                renderTo: 'usersForCategory',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: categories,
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of users'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Users',
                data: data
    }]

        });
    });
    // get number of users for each categories and age level
    categoryService.usersForCategoriesNAge(function (result) {
        console.log(0);
        var categories = _.uniq(_.pluck(result, 'category'));
        var ageDataChild = [];
        var ageDataAdult = [];
        var ageDataYoung = [];
        _.forEach(categories, function (category) {
            var child = _.findLast(result, function (res) {
                return (res.age_level === 'Children' && category === res.category);
            });
            var childCount = child ? child.count : 0;
            ageDataChild.push(childCount);

            var young = _.findLast(result, function (res) {
                return res.age_level === 'Teen & Young Adult' && category === res.category;
            });
            var youngCount = young ? young.count : 0;
            ageDataYoung.push(youngCount);

            var adult = _.findLast(result, function (res) {
                return res.age_level === 'Adult' && category === res.category;
            });
            var adultCount = adult ? adult.count : 0;
            ageDataAdult.push(adultCount);
        });

        var ageDataChildTen = getTopN(_.zipObject(categories, ageDataChild), 10);
        var ageDataYoungTen = getTopN(_.zipObject(categories, ageDataYoung), 10);
        var ageDataAdultTen = getTopN(_.zipObject(categories, ageDataAdult), 10);
        var chartUsersForCategoryNAge = new Highcharts.Chart({

            chart: {
                type: 'column',
                renderTo: 'usersForCategoryNAge',
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: categories,
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Total books'
                },
                //					stackLabels: {
                //						enabled: false,
                //						style: {
                //							fontWeight: 'bold',
                //							color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                //						}
                //					}
            },
            legend: {
                align: 'right',
                x: -70,
                verticalAlign: 'top',
                y: 20,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
                borderColor: '#CCC',
                borderWidth: 1,
                shadow: false
            },
            tooltip: {
                formatter: function () {
                    return '<b>' + this.x + '</b><br/>' +
                        this.series.name + ': ' + this.y + '<br/>' +
                        'Total: ' + this.point.stackTotal;
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal'
                }
            },
            series: [{
                name: 'Children',
                data: ageDataChild
        }, {
                name: 'Teen & Young Adult',
                data: ageDataYoung
        }, {
                name: 'Adult',
                data: ageDataAdult
        }]

        });
        var chartChildCat = new Highcharts.Chart({

            chart: {
                renderTo: 'childUsersForCategoryNAge',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataChildTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of Children'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'users',
                data: _.pluck(ageDataChildTen, 'value')
    }]

        });
        var chartYoungCat = new Highcharts.Chart({

            chart: {
                renderTo: 'youngUsersForCategoryNAge',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataYoungTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of Teen & Young Adult'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'users',
                data: _.pluck(ageDataYoungTen, 'value')
    }]

        });
        var chartAdultCat = new Highcharts.Chart({

            chart: {
                renderTo: 'adultUsersForCategoryNAge',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataAdultTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of Adult'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'users',
                data: _.pluck(ageDataAdultTen, 'value')
    }]

        });

    });
    // Avarage time spent by users for each categories and age level
    categoryService.userTimeSpentCategoryAge(function (result) {
        function sum(numbers) {
            return _.reduce(numbers, function (result, current) {
                return result + parseFloat(current);
            }, 0);
        }
        var stats = analysisService.getBookStatsAgeCateory(result);

        var statsResult = _.chain(stats)
            .groupBy("category")
            .map(function (value, key) {
                return _.chain(value)
                    .groupBy("age_level")
                    .map(function (value1, age_level) {
                        return {
                            category: key,
                            totalTimeSpent: Math.round((sum(_.pluck(value1, "totalTimeSpent")) / 60)),
                            pageReadCount: sum(_.pluck(value1, "pageReadCount")),
                            age_level: age_level
                        }
                    })
                    .value();
            })
            .value();

        var categories = _.sortBy(_.uniq(_.pluck(result, 'category')));
        var ageDataChild = [];
        var ageDataAdult = [];
        var ageDataYoung = [];
        var ageDataChildPagesRead = [];
        var ageDataAdultPagesRead = [];
        var ageDataYoungPagesRead = [];
        var ageDataChildPagesReadAvg = [];
        var ageDataAdultPagesReadAvg = [];
        var ageDataYoungPagesReadAvg = [];
        var childPagesReadAll = 0;
        var youngPagesReadAll = 0;
        var adultPagesReadAll = 0;
        var userTimeSpentChildHistory = [];
        var userTimeSpentChildScience = [];
        var userTimeSpentChildMysteries = [];
        var userTimeSpentYoungScience = [];
        var userTimeSpentYoungMysteries = [];
        var userTimeSpentYoungRomance = [];
        var userTimeSpentAdultScience = [];
        var userTimeSpentAdultMysteries = [];
        var userTimeSpentAdultRomance = [];
        var userTimeSpentAdultLang = [];
        var userTimeSpentMysteriesAll = [];
        var userTimeSpentRomanceAll = [];
        var userTimeSpentScienceAll = [];

        _.forEach(categories, function (category) {
            var cat = _.findLast(statsResult, function (res) {
                return category === res[0].category;
            });
            var child = 0;
            var young = 0;
            var adult = 0;
            var childPagesRead = 0;
            var youngPagesRead = 0;
            var adultPagesRead = 0;
            var childPagesReadAvg = 0;
            var youngPagesReadAvg = 0;
            var adultPagesReadAvg = 0;
            _.forEach(cat, function (catData) {
                if (catData.age_level === 'Children') {
                    child = catData.totalTimeSpent;
                    childPagesRead = catData.pageReadCount;
                    childPagesReadAll += catData.pageReadCount;
                    childPagesReadAvg = round((child / childPagesRead), 2);
                }
                if (catData.age_level === 'Teen & Young Adult') {
                    young = catData.totalTimeSpent;
                    youngPagesRead = catData.pageReadCount;
                    youngPagesReadAll += catData.pageReadCount;
                    youngPagesReadAvg = round((young / youngPagesRead), 2);
                }
                if (catData.age_level === 'Adult') {
                    adult = catData.totalTimeSpent;
                    adultPagesRead = catData.pageReadCount;
                    adultPagesReadAll += catData.pageReadCount;
                    adultPagesReadAvg = round((adult / adultPagesRead), 2);
                }
            });
            ageDataChild.push(child);
            ageDataYoung.push(young);
            ageDataAdult.push(adult);
            ageDataChildPagesRead.push(childPagesRead);
            ageDataYoungPagesRead.push(youngPagesRead);
            ageDataAdultPagesRead.push(adultPagesRead);
            ageDataChildPagesReadAvg.push(childPagesReadAvg);
            ageDataYoungPagesReadAvg.push(youngPagesReadAvg);
            ageDataAdultPagesReadAvg.push(adultPagesReadAvg);

        });


        var ageDataChildTen = getTopN(_.zipObject(categories, ageDataChild), 10);
        var ageDataYoungTen = getTopN(_.zipObject(categories, ageDataYoung), 10);
        var ageDataAdultTen = getTopN(_.zipObject(categories, ageDataAdult), 10);
        var ageDataChildPagesReadTen = getTopN(_.zipObject(categories, ageDataChildPagesRead), 10);
        var ageDataYoungPagesReadTen = getTopN(_.zipObject(categories, ageDataYoungPagesRead), 10);
        var ageDataAdultPagesReadTen = getTopN(_.zipObject(categories, ageDataAdultPagesRead), 10);
        var ageDataChildPagesReadAvgTen = getTopN(_.zipObject(categories, ageDataChildPagesReadAvg), 10);
        var ageDataYoungPagesReadAvgTen = getTopN(_.zipObject(categories, ageDataYoungPagesReadAvg), 10);
        var ageDataAdultPagesReadAvgTen = getTopN(_.zipObject(categories, ageDataAdultPagesReadAvg), 10);
        //Avarege time spent based on all categories and age level

        var chartUserTimeSpentCategoryAge = new Highcharts.Chart({

            chart: {
                type: 'column',
                renderTo: 'userTimeSpentCategoryAge',
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: categories,
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Avarage time spent (Mins)'
                }
            },
            legend: {
                align: 'right',
                x: -70,
                verticalAlign: 'top',
                y: 20,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
                borderColor: '#CCC',
                borderWidth: 1,
                shadow: false
            },
            tooltip: {
                formatter: function () {
                    return '<b>' + this.x + '</b><br/>' +
                        this.series.name + ': ' + this.y + '(Mins)<br/>' +
                        'Total: ' + this.point.stackTotal + '(Mins)';
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal'
                }
            },
            series: [{
                name: 'Children',
                data: ageDataChild
        }, {
                name: 'Teen & Young Adult',
                data: ageDataYoung
        }, {
                name: 'Adult',
                data: ageDataAdult
        }]

        });
        //Total time spents
        var chartChildCatTime = new Highcharts.Chart({

            chart: {
                renderTo: 'childTimeSpentCategory',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataChildTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Time spent (Minutes)'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Minutes',
                data: _.pluck(ageDataChildTen, 'value')
    }]

        });
        var chartYoungCatTime = new Highcharts.Chart({

            chart: {
                renderTo: 'youngTimeSpentCategory',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataYoungTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Time spent (Minutes)'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Minutes',
                data: _.pluck(ageDataYoungTen, 'value')
    }]

        });
        var chartAdultCatTime = new Highcharts.Chart({

            chart: {
                renderTo: 'adultTimeSpentCategory',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataAdultTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Time spent (Minutes)'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Minutes',
                data: _.pluck(ageDataAdultTen, 'value')
    }]

        });
        //Average time spent per page
        var chartChildCatTimeAvg = new Highcharts.Chart({

            chart: {
                renderTo: 'childTimeSpentCategoryAvg',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataChildPagesReadAvgTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Average time spent per page (Minutes)'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Minutes per page',
                data: _.pluck(ageDataChildPagesReadAvgTen, 'value')
    }]

        });
        var chartYoungCatTimeAvg = new Highcharts.Chart({

            chart: {
                renderTo: 'youngTimeSpentCategoryAvg',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataYoungPagesReadAvgTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Average time spent per page (Minutes)'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Minutes per page',
                data: _.pluck(ageDataYoungPagesReadAvgTen, 'value')
    }]

        });
        var chartAdultCatTimeAvg = new Highcharts.Chart({

            chart: {
                renderTo: 'adultTimeSpentCategoryAvg',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataAdultPagesReadAvgTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Average time spent per page (Minutes)'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Minutes per page',
                data: _.pluck(ageDataAdultPagesReadAvgTen, 'value')
    }]

        });

        //Pages read based on age level 
        var pagesReadAll = childPagesReadAll + youngPagesReadAll + adultPagesReadAll;
        var chartUserPagesReadAge = new Highcharts.Chart({

            chart: {
                renderTo: 'userPagesReadAge',
                plotBackgroundColor: null,
                plotBorderWidth: 1, //null,
                plotShadow: false
            },
            title: {
                text: ''
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    }
                }
            },
            series: [{
                type: 'pie',
                name: 'Page reads',
                data: [
                ['Children', (childPagesReadAll / pagesReadAll) * 100],
                    {
                        name: 'Teen & Young Adult',
                        y: (youngPagesReadAll / pagesReadAll) * 100,
                        sliced: true,
                        selected: true
                },
                ['Adult', (adultPagesReadAll / pagesReadAll) * 100]
            ]
        }]

        });
        var chartChildUserPagesReadCategoryTime = new Highcharts.Chart({

            chart: {
                renderTo: 'childUserPagesReadCategory',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataChildPagesReadTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of pages'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Pages',
                data: _.pluck(ageDataChildPagesReadTen, 'value')
    }]

        });
        var chartYoungUserPagesReadCategory = new Highcharts.Chart({

            chart: {
                renderTo: 'youngUserPagesReadCategory',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataYoungPagesReadTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of pages'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Pages',
                data: _.pluck(ageDataYoungPagesReadTen, 'value')
    }]

        });
        var chartAdultUserPagesReadCategory = new Highcharts.Chart({

            chart: {
                renderTo: 'adultUserPagesReadCategory',
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: _.pluck(ageDataAdultPagesReadTen, 'category'),
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of pages'
                }
            },
            plotOptions: {
                column: {
                    groupPadding: 0,
                    pointPadding: 0.1,
                    borderWidth: 1
                }
            },

            series: [{
                name: 'Pages',
                data: _.pluck(ageDataAdultPagesReadTen, 'value')
    }]

        });
        //Pages read based on all categories and age level
        var chartUserPagesReadCategoryAge = new Highcharts.Chart({

            chart: {
                type: 'column',
                renderTo: 'userPagesReadCategoryAge',
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: categories,
                labels: {
                    rotation: -80,
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Numaber of pages'
                }
            },
            legend: {
                align: 'right',
                x: -70,
                verticalAlign: 'top',
                y: 5,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
                borderColor: '#CCC',
                borderWidth: 1,
                shadow: false
            },
            tooltip: {
                formatter: function () {
                    return '<b>' + this.x + '</b><br/>' +
                        this.series.name + ': ' + this.y + '<br/>' +
                        'Total: ' + this.point.stackTotal;
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal'
                }
            },
            series: [{
                name: 'Children',
                data: ageDataChildPagesRead
        }, {
                name: 'Teen & Young Adult',
                data: ageDataYoungPagesRead
        }, {
                name: 'Adult',
                data: ageDataAdultPagesRead
        }]

        });

        var statsWordLookupResult = _.chain(stats)
            .groupBy("user_id")
            .map(function (value, key) {
                return _.chain(value)
                    .groupBy("category")
                    .map(function (value1, category) {
                        return _.chain(value)
                            .groupBy("age_level")
                            .map(function (value2, age_level) {
                                return {
                                    category: category,
                                    totalTimeSpent: Math.round((sum(_.pluck(value2, "totalTimeSpent")) / 60)),
                                    pageReadCount: sum(_.pluck(value2, "pageReadCount")),
                                    age_level: age_level,
                                    lookupWordsCount: _.pluck(value2, "lookupWordsCount"),
                                    user_id: key
                                }
                            })
                            .value();
                    })
                    .value();
            })
            .value();
        //console.log(0,statsWordLookupResult);
        //word_lookups
        var userWordLookup = [];
        var userWordLookupChildHistory = [];
        var userWordLookupChildScience = [];
        var userWordLookupChildMysteries = [];
        var userWordLookupChildAll1 = [];

        var userWordLookupYoungScience = [];
        var userWordLookupYoungMysteries = [];
        var userWordLookupYoungRomance = [];
        var userWordLookupYoungAll1 = [];

        var userWordLookupAdultScience = [];
        var userWordLookupAdultMysteries = [];
        var userWordLookupAdultRomance = [];
        var userWordLookupAdultForeignLanguages = [];
        var userWordLookupAdultAll1 = [];

        _.forEach(statsWordLookupResult, function (wl) {
            _.forEach(wl, function (w) {
                _.forEach(w, function (catWLData) {
                    //console.log('cat=',catWLData.category);
                    //child
                    if (catWLData.age_level === 'Children' && catWLData.category === 'History' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var c1 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentChildHistory.push(c1);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupChildHistory.push([c1, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    if (catWLData.age_level === 'Children' && catWLData.category === 'Science Fiction & Fantasy' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var c2 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentChildScience.push(c2);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupChildScience.push([c2, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    if (catWLData.age_level === 'Children' && catWLData.category === 'Mysteries & Detectives' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var c3 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentChildMysteries.push(c3);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupChildMysteries.push([c3, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    if (catWLData.age_level === 'Children' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var c4 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupChildAll1.push([c4, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    //young
                    if (catWLData.age_level === 'Teen & Young Adult' && catWLData.category === 'Science Fiction & Fantasy' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var y1 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentYoungScience.push(y1);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupYoungScience.push([y1, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    if (catWLData.age_level === 'Teen & Young Adult' && catWLData.category === 'Mysteries & Thrillers' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var y2 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentYoungMysteries.push(y2);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupYoungMysteries.push([y2, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    if (catWLData.age_level === 'Teen & Young Adult' && catWLData.category === 'Romance' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var y3 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentYoungRomance.push(y3);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupYoungRomance.push([y3, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    if (catWLData.age_level === 'Teen & Young Adult' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var y4 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupYoungAll1.push([y4, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    //Adult
                    if (catWLData.age_level === 'Adult' && catWLData.category === 'Science Fiction & Fantasy' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        if (catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                            var a1 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                            userTimeSpentAdultScience.push(a1);
                            if (catWLData.lookupWordsCount[0]) {
                                userWordLookupAdultScience.push([a1, catWLData.lookupWordsCount[0]]);
                            }
                        }
                    }
                    if (catWLData.age_level === 'Adult' && catWLData.category === 'Mystery, Thriller & Suspense' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        if (catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                            var a2 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                            userTimeSpentAdultMysteries.push(a2);
                            if (catWLData.lookupWordsCount[0]) {
                                userWordLookupAdultMysteries.push([a2, catWLData.lookupWordsCount[0]]);
                            }
                        }
                    }

                    if (catWLData.age_level === 'Adult' && catWLData.category === 'Romance' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var a3 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentAdultRomance.push(a3);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupAdultRomance.push([a3, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    if (catWLData.age_level === 'Adult' && catWLData.category === 'Foreign Languages' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var a4 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentAdultLang.push(a4);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupAdultForeignLanguages.push([a4, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    if (catWLData.age_level === 'Adult' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var a5 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        if (catWLData.lookupWordsCount[0]) {
                            userWordLookupAdultAll1.push([a5, catWLData.lookupWordsCount[0]]);
                        }
                    }
                    if (catWLData.category === 'Science Fiction & Fantasy' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var all1 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentScienceAll.push(all1);
                    }
                    if (catWLData.category === 'Mysteries & Thrillers' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var all2 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentMysteriesAll.push(all2);
                    }
                    if (catWLData.category === 'Romance' && catWLData.totalTimeSpent > 0 && catWLData.pageReadCount > 0) {
                        var all3 = round((catWLData.totalTimeSpent / catWLData.pageReadCount), 2);
                        userTimeSpentRomanceAll.push(all3);
                    }

                });
            });

        });
        var userTimeSpentChildcat1T = _.compact(_.zip(userTimeSpentChildMysteries, userTimeSpentChildScience));
        var userTimeSpentChildcat1 = [];
        _.forEach(userTimeSpentChildcat1T, function (arr) {
            var xx = arr[0];
            var yy = arr[1];
            var clr = '#164baf';
            if (typeof (arr[0]) === "undefined") {
                xx = 0;
                clr = '#ef87f4';
            }
            if (typeof (arr[1]) === "undefined") {
                yy = 0;
                clr = '#ef87f4';
            }

            userTimeSpentChildcat1.push({
                x: xx,
                y: yy,
                fillColor: clr
            });
        });
        var userTimeSpentChildcat2T = _.compact(_.zip(userTimeSpentChildHistory, userTimeSpentChildScience));
        var userTimeSpentChildcat2 = [];
        _.forEach(userTimeSpentChildcat2T, function (arr) {
            var xx = arr[0];
            var yy = arr[1];
            var clr = '#164baf';
            if (typeof (arr[0]) === "undefined") {
                xx = 0;
                clr = '#ef87f4';
            }
            if (typeof (arr[1]) === "undefined") {
                yy = 0;
                clr = '#ef87f4';
            }

            userTimeSpentChildcat2.push({
                x: xx,
                y: yy,
                fillColor: clr
            });
        });
        var userTimeSpentYoungcat1T = _.compact(_.zip(userTimeSpentYoungMysteries, userTimeSpentYoungScience));
        var userTimeSpentYoungcat1 = [];
        _.forEach(userTimeSpentYoungcat1T, function (arr) {
            var xx = arr[0];
            var yy = arr[1];
            var clr = '#164baf';
            if (typeof (arr[0]) === "undefined") {
                xx = 0;
                clr = '#ef87f4';
            }
            if (typeof (arr[1]) === "undefined") {
                yy = 0;
                clr = '#ef87f4';
            }

            userTimeSpentYoungcat1.push({
                x: xx,
                y: yy,
                fillColor: clr
            });
        });
        var userTimeSpentYoungcat2T = _.compact(_.zip(userTimeSpentYoungRomance, userTimeSpentYoungScience));
        var userTimeSpentYoungcat2 = [];
        _.forEach(userTimeSpentYoungcat2T, function (arr) {
            var xx = arr[0];
            var yy = arr[1];
            var clr = '#164baf';
            if (typeof (arr[0]) === "undefined") {
                xx = 0;
                clr = '#ef87f4';
            }
            if (typeof (arr[1]) === "undefined") {
                yy = 0;
                clr = '#ef87f4';
            }

            userTimeSpentYoungcat2.push({
                x: xx,
                y: yy,
                fillColor: clr
            });
        });
        var userTimeSpentAdultcat1T = _.compact(_.zip(userTimeSpentAdultMysteries, userTimeSpentAdultScience));
        var userTimeSpentAdultcat1 = [];
        _.forEach(userTimeSpentAdultcat1T, function (arr) {
            var xx = arr[0];
            var yy = arr[1];
            var clr = '#164baf';
            if (typeof (arr[0]) === "undefined") {
                xx = 0;
                clr = '#ef87f4';
            }
            if (typeof (arr[1]) === "undefined") {
                yy = 0;
                clr = '#ef87f4';
            }

            userTimeSpentAdultcat1.push({
                x: xx,
                y: yy,
                fillColor: clr
            });
        });
        var userTimeSpentAdultcat2T = _.compact(_.zip(userTimeSpentAdultRomance, userTimeSpentAdultScience));
        var userTimeSpentAdultcat2 = [];
        _.forEach(userTimeSpentAdultcat2T, function (arr) {
            var xx = arr[0];
            var yy = arr[1];
            var clr = '#164baf';
            if (typeof (arr[0]) === "undefined") {
                xx = 0;
                clr = '#ef87f4';
            }
            if (typeof (arr[1]) === "undefined") {
                yy = 0;
                clr = '#ef87f4';
            }

            userTimeSpentAdultcat2.push({
                x: xx,
                y: yy,
                fillColor: clr
            });
        });
        var userTimeSpentAdultcat3T = _.zip(userTimeSpentAdultRomance, userTimeSpentAdultLang);
        var userTimeSpentAdultcat3 = [];
        _.forEach(userTimeSpentAdultcat3T, function (arr) {
            var xx = arr[0];
            var yy = arr[1];
            var clr = '#164baf';
            if (typeof (arr[0]) === "undefined") {
                xx = 0;
                clr = '#ef87f4';
            }
            if (typeof (arr[1]) === "undefined") {
                yy = 0;
                clr = '#ef87f4';
            }

            userTimeSpentAdultcat3.push({
                x: xx,
                y: yy,
                fillColor: clr
            });
        });
        var userTimeSpentAllcat1T = _.zip(userTimeSpentMysteriesAll, userTimeSpentScienceAll);
        var userTimeSpentAllcat1 = [];
        _.forEach(userTimeSpentAllcat1T, function (arr) {
            var xx = arr[0];
            var yy = arr[1];
            var clr = '#164baf';
            if (typeof (arr[0]) === "undefined") {
                xx = 0;
                clr = '#ef87f4';
            }
            if (typeof (arr[1]) === "undefined") {
                yy = 0;
                clr = '#ef87f4';
            }

            userTimeSpentAllcat1.push({
                x: xx,
                y: yy,
                fillColor: clr
            });
        });
        var userTimeSpentAllcat2T = _.zip(userTimeSpentRomanceAll, userTimeSpentScienceAll);
        var userTimeSpentAllcat2 = [];
        _.forEach(userTimeSpentAllcat2T, function (arr) {
            var xx = arr[0];
            var yy = arr[1];
            var clr = '#164baf';
            if (typeof (arr[0]) === "undefined") {
                xx = 0;
                clr = '#ef87f4';
            }
            if (typeof (arr[1]) === "undefined") {
                yy = 0;
                clr = '#ef87f4';
            }

            userTimeSpentAllcat2.push({
                x: xx,
                y: yy,
                fillColor: clr
            });
        });
        setTimeout(function () {
            var childWordLookupScatterCat1 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'childWordLookupScatterCat1',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Child user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupChildHistory

        }]

            });
            var childWordLookupScatterCat2 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'childWordLookupScatterCat2',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Child user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupChildScience

        }]

            });
            var childWordLookupScatterCat3 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'childWordLookupScatterCat3',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Child user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupChildMysteries

        }]

            });
            var childAvgTimeSpentScatterCat1 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'childAvgTimeSpentScatterCat1',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Mysteries and Detectives (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                yAxis: {
                    title: {
                        enabled: true,
                        text: 'Science Fiction and Fantasy (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Child user',
                    //                    color: 'rgba(223, 83, 83, .5)',
                    data: userTimeSpentChildcat1

        }]

            });
            var childAvgTimeSpentScatterCat2 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'childAvgTimeSpentScatterCat2',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'History (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                yAxis: {
                    title: {
                        enabled: true,
                        text: 'Science Fiction and Fantasy (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Child user',
                    //                    color: 'rgba(223, 83, 83, .5)',
                    data: userTimeSpentChildcat2

        }]

            });

            var youngWordLookupScatterCat1 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'youngWordLookupScatterCat1',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Teen & Young Adult user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupYoungScience

        }]

            });
            var youngWordLookupScatterCat2 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'youngWordLookupScatterCat2',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Teen & Young Adult user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupYoungMysteries

        }]

            });
            var youngWordLookupScatterCat3 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'youngWordLookupScatterCat3',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Teen & Young Adult user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupYoungRomance

        }]

            });
            var youngAvgTimeSpentScatterCat1 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'youngAvgTimeSpentScatterCat1',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Mysteries and Detectives (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                yAxis: {
                    title: {
                        enabled: true,
                        text: 'Science Fiction and Fantasy (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Teen & Young Adult user',
                    //                    color: 'rgba(223, 83, 83, .5)',
                    data: userTimeSpentYoungcat1

        }]

            });
            var youngAvgTimeSpentScatterCat2 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'youngAvgTimeSpentScatterCat2',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Romance (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                yAxis: {
                    title: {
                        enabled: true,
                        text: 'Science Fiction and Fantasy (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Teen & Young Adult user',
                    //                    color: 'rgba(223, 83, 83, .5)',
                    data: userTimeSpentYoungcat2

        }]

            });

            var adultWordLookupScatterCat1 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'adultWordLookupScatterCat1',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Adult user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupAdultScience

        }]

            });
            var adultWordLookupScatterCat2 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'adultWordLookupScatterCat2',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Adult user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupAdultMysteries

        }]

            });
            var adultWordLookupScatterCat3 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'adultWordLookupScatterCat3',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Adult user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupAdultRomance

        }]

            });
            var adultWordLookupScatterCat4 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'adultWordLookupScatterCat4',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Adult user',
                    color: 'rgba(223, 83, 83, .5)',
                    data: userWordLookupAdultForeignLanguages

        }]

            });
            var adultAvgTimeSpentScatterCat1 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'adultAvgTimeSpentScatterCat1',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Mystery, Thriller and Suspense(Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.2,
                    min: 0,
                    max: 3,
                    minorTickInterval: 'auto'
                },
                yAxis: {
                    title: {
                        enabled: true,
                        text: 'Science Fiction and Fantasy (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.2,
                    min: 0,
                    max: 3,
                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Adult user',
                    //                    color: 'rgba(223, 83, 83, .5)',
                    data: userTimeSpentAdultcat1

        }]

            });
            var adultAvgTimeSpentScatterCat2 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'adultAvgTimeSpentScatterCat2',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Romance (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.2,
                    min: 0,
                    max: 3,
                    minorTickInterval: 'auto'
                },
                yAxis: {
                    title: {
                        enabled: true,
                        text: 'Science Fiction and Fantasy (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.2,
                    min: 0,
                    max: 3,
                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Adult user',
                    //                    color: 'rgba(223, 83, 83, .5)',
                    data: userTimeSpentAdultcat2

        }]

            });
            var adultAvgTimeSpentScatterCat3 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'adultAvgTimeSpentScatterCat3',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Romance (Average Time in Minutes)'
                    },
                    endOnTick: false,
                    showLastLabel: true,
                    tickInterval: 0.2,
                    min: 0,
                    max: 2,
                    minorTickInterval: 'auto'
                },
                yAxis: {
                    title: {
                        text: 'Foreign Languages (Average Time in Minutes)'
                    },
                    endOnTick: false,
                    showLastLabel: true,
                    tickInterval: 0.2,
                    min: 0,
                    max: 2,
                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Adult user',
                    //                    color: 'rgba(223, 83, 83, .5)',
                    data: userTimeSpentAdultcat3

        }]

            });

            var allWordLookupScatterCat1 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'allWordLookupScatterCat1',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    endOnTick: false,
                    showLastLabel: true,
                    tickInterval: 0.2,
                    min: 0,
                    max: 2,
                    minorTickInterval: 'auto'
                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    },
                    tickInterval: 0.2,
                    min: 0,
                    max: 2,
                    minorTickInterval: 'auto'
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 100,
                    y: 70,
                    floating: true,
                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                    borderWidth: 1
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Children user',
                    color: 'rgba(219, 46, 226, 0.5)',
                    data: userWordLookupChildScience

        }, {
                    name: 'Teen & Young Adult user',
                    color: 'rgba(11, 39, 155, 0.5)',
                    data: userWordLookupYoungScience

        }, {
                    name: 'Adult user',
                    color: 'rgba(17, 163, 17, 0.5)',
                    data: userWordLookupAdultScience

        }]

            });
            var allWordLookupScatterCat2 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'allWordLookupScatterCat2',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Average time spent per page (Minutes)'
                    },
                    endOnTick: false,
                    showLastLabel: true,
                    //                    tickInterval: 0.2,
                    //                    min: 0,
                    //                    max: 2,
                    //                    minorTickInterval: 'auto'

                },
                yAxis: {
                    title: {
                        text: '# of words lookup'
                    },
                    //                    tickInterval: 0.2,
                    //                    min: 0,
                    //                    max: 2,
                    //                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'Children user',
                    color: 'rgba(219, 46, 226, 0.5)',
                    data: userWordLookupChildAll1

        }, {
                    name: 'Teen & Young Adult user',
                    color: 'rgba(11, 39, 155, 0.5)',
                    data: userWordLookupYoungAll1

        }, {
                    name: 'Adult user',
                    color: 'rgba(17, 163, 17, 0.5)',
                    data: userWordLookupAdultAll1

        }]

            });
            var allAvgTimeSpentScatterCat1 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'allAvgTimeSpentScatterCat1',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Mysteries and Detectives (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'

                },
                yAxis: {
                    title: {
                        enabled: true,
                        text: 'Science Fiction and Fantasy (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'User',
                    //                    color: 'rgba(223, 83, 83, .5)',
                    data: userTimeSpentAllcat1

        }]

            });
            var allAvgTimeSpentScatterCat2 = new Highcharts.Chart({

                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    renderTo: 'allAvgTimeSpentScatterCat2',
                },
                title: {
                    text: ''
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: 'Romance (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'

                },
                yAxis: {
                    title: {
                        enabled: true,
                        text: 'Science Fiction and Fantasy (Average Time in Minutes)'
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true,
                    tickInterval: 0.5,
                    min: 0,
                    max: 4,
                    minorTickInterval: 'auto'
                },
                //                legend: {
                //                    layout: 'vertical',
                //                    align: 'left',
                //                    verticalAlign: 'top',
                //                    x: 100,
                //                    y: 70,
                //                    floating: true,
                //                    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                //                    borderWidth: 1
                //                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x} , {point.y} '
                        }
                    }
                },
                series: [{
                    name: 'User',
                    //                    color: 'rgba(223, 83, 83, .5)',
                    data: userTimeSpentAllcat2

        }]

            });
        }, 1000);
    });
    // Avarage time spent by users for categories and word lookups


    function getTopN(arr, Num) {
        var newData = [];
        _.forEach(arr, function (val, key) {
            newData.push({
                category: key,
                value: val
            });
        });
        return $filter('limitTo')($filter('orderBy')(newData, 'value', 'reverse'), Num);
    }

    function round(value, decimals) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }
});