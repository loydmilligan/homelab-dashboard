import type { ReactNode } from 'react';

interface Props {
  title: string;
  children?: ReactNode;
}

export function UnderConstruction({ title, children }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-100">{title}</h2>

      <div className="relative">
        {/* Opaque overlay with watermark */}
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 rotate-[-15deg] select-none">
              MOCK DATA
            </div>
            <div className="text-lg text-gray-500 mt-2">Under Construction</div>
          </div>
        </div>

        {/* Mock content behind overlay */}
        <div className="opacity-30 pointer-events-none min-h-[300px] p-6 border border-gray-800 rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
