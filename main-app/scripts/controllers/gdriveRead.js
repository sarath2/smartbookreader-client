mainApp.controller('GDriveReadCtrl', function ($scope, $rootScope, $location, gDriveReadService) {
	//read gDrive
	gDriveReadService.list(function (files) {
		$scope.gDriveFiles = files;
	});
	//download gdrive file
	$scope.downloadFile = function (file) {
		gDriveReadService.download(file, function (response) {
			$scope.downloaded = response;
		});
	};
});