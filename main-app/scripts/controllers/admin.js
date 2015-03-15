mainApp.controller('adminCtrl', function ($scope, $rootScope, $location, adminService, ngTableParams, $filter) {
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
		_.forEach(info,function(data){
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

});