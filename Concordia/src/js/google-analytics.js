// GOOGLE ANALYTICS GENERATED CODE
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-76281500-1', 'auto');
		ga('send', 'pageview');

// END GOOGLE ANALYTICS GENERATED CODE

var gaConfig = {
	eventDetails: null,
	setValues: function (config) {
		var arr = [];
		var configObj = {
			width: 'w' + config.rhythmicGrid.W,
			ratio: 'r' + config.ratio.str,
			baseline: 'b' + config.baseline,
			gutter: 'g' + config.gutter.W
		}
		for (key in configObj) {
			arr.push(configObj[key]);
		}
		this.eventDetails = arr.join();
	}
};
