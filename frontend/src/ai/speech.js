export function speak(text) {

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";

    speech.rate = 1;

    speech.pitch = 1;

    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(speech);

}