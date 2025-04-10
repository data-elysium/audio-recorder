
export async function getMediaStream(): Promise<MediaStream> {
    try {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
        console.error('Error accessing microphone:', error);
        throw new Error('Unable to access microphone. Please check permissions.');
    }
}

export function createAudioContext(): [AudioContext, AnalyserNode] {
    // Create audio context
    const audioContext = new window.AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    return [audioContext, analyser];
}

export function drawAudioVisualizer(
    analyser: AnalyserNode,
    visualizerElement: HTMLElement | null,
    isRecording: boolean
): number | null {
    if (!visualizerElement || !isRecording) return null;

    // Clear existing bars
    visualizerElement.innerHTML = '';

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Only use a portion of the frequency data for better visuals
    const usableLength = Math.min(32, bufferLength);

    // Create bars
    for (let i = 0; i < usableLength; i++) {
        const bar = document.createElement('div');
        bar.classList.add('audio-bar');
        
        const barHeight = (dataArray[i] / 255) * 100;
        bar.style.height = `${Math.max(4, barHeight)}px`;
        
        visualizerElement.appendChild(bar);
    }

    // Return the animation frame ID
    return requestAnimationFrame(() => 
        drawAudioVisualizer(analyser, visualizerElement, isRecording)
    );
}

export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
  