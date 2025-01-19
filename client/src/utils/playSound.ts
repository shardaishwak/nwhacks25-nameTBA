export function playSound(effect: string) {
    // Implementation of your playSound
    const audio = new Audio(`/sounds/${effect}.mp3`);
    audio.play();
  }
  