import { useZcashBridge } from '@/hooks/useZcashBridge';
import { ZCASH_CONFIG } from '@/utils/constants';

interface ZcashBridgeStatusProps {
    className?: string;
}

export function ZcashBridgeStatus({ className = '' }: ZcashBridgeStatusProps) {
    const { isConnected, isEnabled } = useZcashBridge();

    // Don't show if Zcash is disabled
    if (!ZCASH_CONFIG.ENABLED || !isEnabled) {
        return null;
    }

    const statusColor = isConnected ? 'text-green-400' : 'text-yellow-400';
    const statusText = isConnected ? 'Connected' : 'Connecting...';
    const statusIcon = isConnected ? '🔒' : '⏳';

    return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
            <span>{statusIcon}</span>
            <span className={statusColor}>
                Zcash Bridge: {statusText}
            </span>
            {isConnected && (
                <span className="text-xs text-gray-400">
                    (Private entry available)
                </span>
            )}
        </div>
    );
}