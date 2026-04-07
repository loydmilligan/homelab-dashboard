import { UnderConstruction } from '../components/UnderConstruction';

export function Secrets() {
  return (
    <UnderConstruction title="Secrets">
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-200 mb-3">Secret Rotation Status</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2">Name</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Last Rotated</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-700/50">
                <td className="py-2">OPENROUTER_API_KEY</td>
                <td className="py-2">API Key</td>
                <td className="py-2">45 days ago</td>
                <td className="py-2 text-green-400">OK</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2">HA_LONG_LIVED_TOKEN</td>
                <td className="py-2">Token</td>
                <td className="py-2">120 days ago</td>
                <td className="py-2 text-yellow-400">Due Soon</td>
              </tr>
              <tr>
                <td className="py-2">CLOUDFLARE_TUNNEL_TOKEN</td>
                <td className="py-2">Token</td>
                <td className="py-2">180 days ago</td>
                <td className="py-2 text-red-400">Overdue</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </UnderConstruction>
  );
}
