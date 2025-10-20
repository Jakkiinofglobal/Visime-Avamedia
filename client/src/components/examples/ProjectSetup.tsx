import ProjectSetup from '../ProjectSetup';

export default function ProjectSetupExample() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <ProjectSetup onComplete={(config) => console.log('Setup complete:', config)} />
    </div>
  );
}
