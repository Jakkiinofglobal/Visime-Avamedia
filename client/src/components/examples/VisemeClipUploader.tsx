import VisemeClipUploader from '../VisemeClipUploader';

export default function VisemeClipUploaderExample() {
  return (
    <div className="p-8">
      <VisemeClipUploader onContinue={() => console.log('Continue to test')} />
    </div>
  );
}
