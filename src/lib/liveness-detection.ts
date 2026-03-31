import * as faceapi from 'face-api.js';

export type LivenessChallenge = 'blink' | 'turn-left' | 'turn-right' | 'nod';

export interface LivenessState {
  currentChallenge: LivenessChallenge | null;
  challengesCompleted: LivenessChallenge[];
  isLive: boolean;
  progress: number;
  message: string;
}

interface FacePosition {
  yaw: number; // left-right rotation (-1 to 1)
  pitch: number; // up-down rotation (-1 to 1)
  eyeAspectRatio: number;
}

// Eye aspect ratio threshold for blink detection
const EAR_THRESHOLD = 0.25;
const BLINK_CONSECUTIVE_FRAMES = 2;

// Head rotation thresholds
const YAW_THRESHOLD = 0.15; // For left/right turn detection
const PITCH_THRESHOLD = 0.12; // For nod detection

export class LivenessDetector {
  private blinkCounter = 0;
  private blinkDetected = false;
  private baselinePosition: FacePosition | null = null;
  private consecutiveBlinkFrames = 0;
  private challengeStartTime = 0;
  private readonly challengeTimeout = 8000; // 8 seconds per challenge

  // Challenges to complete for liveness
  private readonly requiredChallenges: LivenessChallenge[] = ['blink', 'turn-left'];
  private completedChallenges: Set<LivenessChallenge> = new Set();
  private currentChallengeIndex = 0;

  reset(): void {
    this.blinkCounter = 0;
    this.blinkDetected = false;
    this.baselinePosition = null;
    this.consecutiveBlinkFrames = 0;
    this.completedChallenges.clear();
    this.currentChallengeIndex = 0;
    this.challengeStartTime = Date.now();
  }

  getCurrentChallenge(): LivenessChallenge | null {
    if (this.currentChallengeIndex >= this.requiredChallenges.length) {
      return null;
    }
    return this.requiredChallenges[this.currentChallengeIndex];
  }

  isComplete(): boolean {
    return this.currentChallengeIndex >= this.requiredChallenges.length;
  }

  getProgress(): number {
    return (this.currentChallengeIndex / this.requiredChallenges.length) * 100;
  }

  getCompletedChallenges(): LivenessChallenge[] {
    return Array.from(this.completedChallenges);
  }

  isChallengeTimedOut(): boolean {
    return Date.now() - this.challengeStartTime > this.challengeTimeout;
  }

  private calculateEyeAspectRatio(landmarks: faceapi.FaceLandmarks68): number {
    // Get eye landmarks
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Calculate EAR for both eyes
    const leftEAR = this.getEAR(leftEye);
    const rightEAR = this.getEAR(rightEye);

    // Average EAR
    return (leftEAR + rightEAR) / 2;
  }

  private getEAR(eye: faceapi.Point[]): number {
    // Eye aspect ratio calculation
    // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    // Where p1-p6 are the 6 eye landmark points

    const vertical1 = this.distance(eye[1], eye[5]);
    const vertical2 = this.distance(eye[2], eye[4]);
    const horizontal = this.distance(eye[0], eye[3]);

    if (horizontal === 0) return 0;
    return (vertical1 + vertical2) / (2 * horizontal);
  }

  private distance(p1: faceapi.Point, p2: faceapi.Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  private estimateHeadPose(landmarks: faceapi.FaceLandmarks68): { yaw: number; pitch: number } {
    // Get key facial points for head pose estimation
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jaw = landmarks.getJawOutline();

    // Calculate eye center
    const leftEyeCenter = this.getCenter(leftEye);
    const rightEyeCenter = this.getCenter(rightEye);
    const eyeCenter = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
    };

    // Nose tip
    const noseTip = nose[6]; // Bottom of nose

    // Face width using jaw
    const faceWidth = this.distance(jaw[0], jaw[16]);

    // Yaw estimation: nose offset from face center
    const faceCenter = (jaw[0].x + jaw[16].x) / 2;
    const noseOffset = (noseTip.x - faceCenter) / (faceWidth / 2);
    const yaw = Math.max(-1, Math.min(1, noseOffset));

    // Pitch estimation: vertical position of nose relative to eyes
    const eyeToNose = noseTip.y - eyeCenter.y;
    const expectedEyeToNose = faceWidth * 0.35; // Approximate ratio
    const pitchOffset = (eyeToNose - expectedEyeToNose) / expectedEyeToNose;
    const pitch = Math.max(-1, Math.min(1, pitchOffset * 0.5));

    return { yaw, pitch };
  }

  private getCenter(points: faceapi.Point[]): { x: number; y: number } {
    const sum = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  async processFrame(
    detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>
  ): Promise<LivenessState> {
    const challenge = this.getCurrentChallenge();
    
    if (!challenge) {
      return {
        currentChallenge: null,
        challengesCompleted: this.getCompletedChallenges(),
        isLive: true,
        progress: 100,
        message: 'লাইভনেস যাচাই সম্পন্ন!',
      };
    }

    // Check timeout
    if (this.isChallengeTimedOut()) {
      return {
        currentChallenge: challenge,
        challengesCompleted: this.getCompletedChallenges(),
        isLive: false,
        progress: this.getProgress(),
        message: 'সময় শেষ! আবার চেষ্টা করুন।',
      };
    }

    const landmarks = detection.landmarks;
    const ear = this.calculateEyeAspectRatio(landmarks);
    const headPose = this.estimateHeadPose(landmarks);

    // Set baseline if not set
    if (!this.baselinePosition) {
      this.baselinePosition = {
        yaw: headPose.yaw,
        pitch: headPose.pitch,
        eyeAspectRatio: ear,
      };
    }

    let challengeComplete = false;
    let message = '';

    switch (challenge) {
      case 'blink':
        // Detect blink by checking if EAR drops below threshold
        if (ear < EAR_THRESHOLD) {
          this.consecutiveBlinkFrames++;
        } else {
          if (this.consecutiveBlinkFrames >= BLINK_CONSECUTIVE_FRAMES) {
            this.blinkCounter++;
            if (this.blinkCounter >= 1) {
              challengeComplete = true;
            }
          }
          this.consecutiveBlinkFrames = 0;
        }
        message = this.blinkCounter > 0 
          ? `চোখ পিটপিট করুন (${this.blinkCounter}/1 সম্পন্ন)` 
          : 'চোখ পিটপিট করুন';
        break;

      case 'turn-left':
        // Detect left head turn
        const yawLeft = headPose.yaw - (this.baselinePosition?.yaw || 0);
        if (yawLeft < -YAW_THRESHOLD) {
          challengeComplete = true;
        }
        message = 'বাম দিকে মাথা ঘোরান';
        break;

      case 'turn-right':
        // Detect right head turn
        const yawRight = headPose.yaw - (this.baselinePosition?.yaw || 0);
        if (yawRight > YAW_THRESHOLD) {
          challengeComplete = true;
        }
        message = 'ডান দিকে মাথা ঘোরান';
        break;

      case 'nod':
        // Detect head nod (up-down movement)
        const pitchDiff = Math.abs(headPose.pitch - (this.baselinePosition?.pitch || 0));
        if (pitchDiff > PITCH_THRESHOLD) {
          challengeComplete = true;
        }
        message = 'মাথা উপরে-নিচে নাড়ান';
        break;
    }

    if (challengeComplete) {
      this.completedChallenges.add(challenge);
      this.currentChallengeIndex++;
      this.challengeStartTime = Date.now();
      this.baselinePosition = null; // Reset baseline for next challenge
      this.blinkCounter = 0;
      this.consecutiveBlinkFrames = 0;
    }

    return {
      currentChallenge: this.getCurrentChallenge(),
      challengesCompleted: this.getCompletedChallenges(),
      isLive: this.isComplete(),
      progress: this.getProgress(),
      message: this.isComplete() ? 'লাইভনেস যাচাই সম্পন্ন!' : message,
    };
  }
}

export function getChallengeInstruction(challenge: LivenessChallenge): string {
  switch (challenge) {
    case 'blink':
      return 'চোখ পিটপিট করুন';
    case 'turn-left':
      return 'বাম দিকে মাথা ঘোরান';
    case 'turn-right':
      return 'ডান দিকে মাথা ঘোরান';
    case 'nod':
      return 'মাথা উপরে-নিচে নাড়ান';
    default:
      return '';
  }
}

export function getChallengeIcon(challenge: LivenessChallenge): string {
  switch (challenge) {
    case 'blink':
      return '👁️';
    case 'turn-left':
      return '⬅️';
    case 'turn-right':
      return '➡️';
    case 'nod':
      return '↕️';
    default:
      return '✓';
  }
}
