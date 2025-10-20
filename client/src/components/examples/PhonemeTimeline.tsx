import PhonemeTimeline from '../PhonemeTimeline';

//todo: remove mock functionality
const mockSegments = [
  { phoneme: "dh", start: 0.0, end: 0.15, viseme: "V11" },
  { phoneme: "ah", start: 0.15, end: 0.30, viseme: "V3" },
  { phoneme: "k", start: 0.30, end: 0.45, viseme: "V14" },
  { phoneme: "w", start: 0.45, end: 0.60, viseme: "V8" },
  { phoneme: "ih", start: 0.60, end: 0.75, viseme: "V6" },
  { phoneme: "k", start: 0.75, end: 0.90, viseme: "V14" },
  { phoneme: "b", start: 0.90, end: 1.05, viseme: "V1" },
  { phoneme: "r", start: 1.05, end: 1.20, viseme: "V13" },
  { phoneme: "aw", start: 1.20, end: 1.40, viseme: "V7" },
  { phoneme: "n", start: 1.40, end: 1.55, viseme: "V14" },
  { phoneme: "f", start: 1.55, end: 1.75, viseme: "V10" },
  { phoneme: "aa", start: 1.75, end: 1.90, viseme: "V3" },
  { phoneme: "k", start: 1.90, end: 2.05, viseme: "V14" },
  { phoneme: "s", start: 2.05, end: 2.25, viseme: "V12" },
  { phoneme: "jh", start: 2.25, end: 2.40, viseme: "V12" },
  { phoneme: "ah", start: 2.40, end: 2.55, viseme: "V3" },
  { phoneme: "m", start: 2.55, end: 2.70, viseme: "V1" },
  { phoneme: "p", start: 2.70, end: 2.85, viseme: "V1" },
  { phoneme: "s", start: 2.85, end: 3.20, viseme: "V12" },
];

export default function PhonemeTimelineExample() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PhonemeTimeline 
        segments={mockSegments}
        duration={3.2}
        onContinue={() => console.log('Continue to upload clips')}
      />
    </div>
  );
}
