import { UnderConstruction } from '../components/UnderConstruction';

export function Logs() {
  return (
    <UnderConstruction title="Logs">
      <div className="space-y-4 text-gray-500">
        <p>Container logs from CM4 and Laptop</p>
        <p>Filterable by service, level, and time range</p>
        <p>Real-time log streaming</p>
      </div>
    </UnderConstruction>
  );
}
