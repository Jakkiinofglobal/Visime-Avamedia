import AvatarPreview from '../AvatarPreview';

export default function AvatarPreviewExample() {
  return (
    <div className="p-8">
      <AvatarPreview onExport={() => console.log('Export triggered')} />
    </div>
  );
}
