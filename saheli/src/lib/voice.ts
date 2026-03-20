type SpeechRecognition = any;

interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class VoiceManager {
  private recognition: SpeechRecognition | null = null;
  public isSupported: boolean = false;

  constructor() {
    const SpeechRec = (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition;
    if (SpeechRec) {
      this.isSupported = true;
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
    }
  }

  private explicitlyStopped = false;

  start(onResult: (transcript: string, isFinal: boolean) => void, onEnd: () => void, language: string = 'en-US') {
    if (!this.recognition) return;
    this.recognition.lang = language;
    this.recognition.interimResults = true;
    this.recognition.continuous = true;
    this.explicitlyStopped = false;
    
    this.recognition.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }
      onResult((finalStr + ' ' + interimStr).trim(), false);
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech API Error:", event.error);
      
      // Do not auto-reboot on critical failures to prevent invisible ghost recordings
      if (event.error !== 'no-speech') {
        this.explicitlyStopped = true; 
      }
      
      if (event.error === 'not-allowed') {
        alert("Microphone connection blocked. Please allow permissions in your browser settings.");
      } else if (event.error === 'network') {
        alert("Speech API Network Error: The browser failed to connect to the speech recognition server. If on localhost, verify your connection, or check if an extension is blocking it.");
      }
      
      onEnd();
    };

    this.recognition.onend = () => {
      // If not explicitly stopped by the user, immediately try to seamlessly restart!
      if (!this.explicitlyStopped) {
        try {
          this.recognition.start();
        } catch (e) {
          onEnd();
        }
      } else {
        onEnd();
      }
    };

    try {
      this.recognition.start();
    } catch(e) {}
  }

  stop() {
    this.explicitlyStopped = true;
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export const voiceManager = new VoiceManager();
