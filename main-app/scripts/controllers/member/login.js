mainApp.controller('LoginCtrl', function ($rootScope, $scope, $http, $timeout, $interval, $location, member, session, Token) {

	// first logout the current user even if user already logged in
	session.end(function () {});

	// initially no errors, status is processing
	$scope.login_error = "";
	$scope.processing = false;

	// login button click event
	$scope.login = function () {

		if ($scope.loginForm.$invalid)
			return;

		$scope.processing = true;

		member.login($scope.user, function (result, response) {

			// request successful (status 200)
			if (result) {
				// everything is fine
				if (response.status) {
					var user = response.result;

					// credentials are correct, login successful, now start session
					session.start(user, function () {
						$location.path('/');
					})
				}
				// request status is 200, but response.result is not OK (shouldn't happen)
				else {
					alert('Error while logging in. Please contact system administrator.');
				}
			}
			// request failed (status not 200), most probably auth error
			else {
				if (response) {
					$scope.user = null;
					$scope.login_error = "Wrong credentials. Please check your username and password!";
					$scope.processing = false;
				} else {
					$scope.user = null;
					$scope.login_error = "Server is not available, please try again later.";
					$scope.processing = false;
				}
			}
		});
	};
	//$scope.accessToken = Token.get();
	var oAuthInt = null;
	var getGOauth = function () {
		member.getOaut({
			msg: ''
		}, function (result, response) {
			// request successful (status 200)
			if (result) {
				if (response.logged) {
					$interval.cancel(oAuthInt);
					member.login({
						username: response.email ? ('@oa@' + response.email) : '',
						password: '@oa@'
					}, function (result, response) {
						// request successful (status 200)
						if (result) {
							// everything is fine
							if (response.status) {
								var user = response.result;
								// credentials are correct, login successful, now start session
								session.start(user, function () {
									$location.path('/');
								})
							}
							// request status is 200, but response.result is not OK (shouldn't happen)
							else {
								alert('Error while logging in. Please contact system administrator.');
							}
						}

						// request failed (status not 200), most probably auth error
						else {
							if (response) {
								$scope.user = null;
								$scope.login_error = "Wrong credentials. Please check your username and password!";
								$scope.processing = false;
							} else {
								$scope.user = null;
								$scope.login_error = "Server is not available, please try again later.";
								$scope.processing = false;
							}
						}
					});
				}
			}
		});
	};
	$scope.authenticate = function () {
		var extraParams = $scope.askApproval ? {
			approval_prompt: 'force'
		} : {};
		Token.getTokenByPopup(extraParams)
			.then(function (params) {
				window.addEventListener("message", receiveMessage, false);
				// Success getting token from popup.
				// Verify the token before setting it, to avoid the confused deputy problem.
				Token.verifyAsync(params.access_token).
				then(function (data) {
					$rootScope.$apply(function () {
						$scope.accessToken = params.access_token;
						$scope.expiresIn = params.expires_in;
						Token.set(params.access_token);
					});
				}, function () {
					alert("Failed to verify token.");
				});

			}, function () {
				// Failure getting token from popup.
				alert("Failed to get token from popup.");
			});
		oAuthInt = $interval(getGOauth, 5000, 15);
	};

});