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

  start(onResult: (transcript: string, isFinal: boolean) => void, onEnd: () => void, language: string = 'en-US') {
    if (!this.recognition) return;
    this.recognition.lang = language;
    
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

    this.recognition.onend = () => {
      onEnd();
    };

    this.recognition.start();
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export const voiceManager = new VoiceManager();
