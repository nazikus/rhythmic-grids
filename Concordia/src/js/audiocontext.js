function gridSound () {
	var oscillator, context, AudioContext;
	
	AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext();

	oscillator = context.createOscillator();
	
	// external methods
	function makeSound() {
		
		setFrequency(4);
		oscillator.type = 'sine';

		oscillator.connect(context.destination);
		oscillator.start(0);

	}

	function stopSound() {
		oscillator.stop(0);
		oscillator.disconnect(context.destination);
	}

	function setFrequency(frequency) {
    	oscillator.frequency.value = 5000;
	}

	return {
		setFrequency: setFrequency,
		makeSound: makeSound,
		stopSound: stopSound
	}
}