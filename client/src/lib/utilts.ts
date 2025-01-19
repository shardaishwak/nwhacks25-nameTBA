type SoundFile =
	| "knockout"
	| "punch"
	| "slap-2"
	| "slap"
	| "swords"
	| "ready-go";

export function playSound(fileName: SoundFile) {
	// Construct the path to the sound file
	const soundUrl = `/sounds/${fileName}.mp3`;

	// Create a new audio object
	const audio = new Audio(soundUrl);

	// Play the audio
	audio
		.play()
		.then(() => {
			console.log("Sound is playing...");
			// renderVisual(fileName);
		})
		.catch((error) => {
			console.error("Error playing sound:", error);
		});
}

export function renderVisual(fileName: SoundFile) {
	// Construct the path to the visual file
	const visualUrl = `/visuals/${fileName}.webp`;

	// Create or update the visual element in the DOM
	let visualElement = document.getElementById("audio-visual") as HTMLImageElement;

	if (!visualElement) {
		visualElement = document.createElement("img") as HTMLImageElement;
		visualElement.id = "audio-visual";
		visualElement.style.position = "fixed";
		visualElement.style.top = "50%";
		visualElement.style.left = "50%";
		visualElement.style.transform = "translate(-50%, -50%) scale(0)";
		visualElement.style.transition =
			"transform 0.5s ease-out, opacity 0.5s ease-out";
		visualElement.style.opacity = "0";
		visualElement.style.zIndex = "1000";
		document.body.appendChild(visualElement);
	}

	// Update the source and initialize the visual hidden
	visualElement.src = visualUrl;
	visualElement.style.display = "block";

	// Trigger the animation to fade in and scale up
	requestAnimationFrame(() => {
		visualElement.style.opacity = "1";
		visualElement.style.transform = "translate(-50%, -50%) scale(1)";
	});

	// Automatically hide the visual after 1.5 seconds
	setTimeout(() => {
		if (visualElement) {
			visualElement.style.opacity = "0";
			visualElement.style.transform = "translate(-50%, -50%) scale(0)";
			setTimeout(() => {
				visualElement.style.display = "none";
			}, 500); // Wait for the transition to complete before hiding
		}
	}, 1500);
}
