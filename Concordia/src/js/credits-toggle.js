(function($) {
	$(document).ready(function(){
		var creditsToggleBtn = $('#credits-toggle'),
		creditsSection = $('#credits-section'),
		initialSection = $('#initial-section');

		creditsToggleBtn.on('click', function(e) {
			e.preventDefault();
			var isCreditsActive = $(this).data('credits-visible');
			toggleCredits(creditsToggleBtn, creditsSection, initialSection, isCreditsActive);
		});

		function toggleCredits(showTrigger, creditsSection, initialSection, isCreditsActive) {
			if (isCreditsActive) {
				showTrigger.removeClass('hidden');
				showTrigger.data('credits-visible', false);
				creditsSection.addClass("hidden");
				window.setTimeout(function () {
					initialSection.removeClass("hidden");
				}, 300);
			} else {
				showTrigger.addClass('hidden');
				showTrigger.data('credits-visible', true);
				initialSection.addClass("hidden");
				creditsSection.removeClass("hidden");
			}

		}
	});
})(jQuery);