import StatusBar from '../StatusBar';

export default function StatusBarExample() {
  return (
    <div className="space-y-4">
      <StatusBar micActive={false} virtualCameraOn={false} latency={0} />
      <StatusBar micActive={true} virtualCameraOn={true} latency={280} />
      <StatusBar micActive={true} virtualCameraOn={true} latency={450} />
      <StatusBar micActive={true} virtualCameraOn={false} latency={620} />
    </div>
  );
}
