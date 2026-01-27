'use client';

import { useZcashBridge } from '@/hooks/useZcashBridge';
import { ZCASH_CONFIG } from '@/utils/constants';

interface PrivacyStatusIndicatorProps {
    className?: string;
}

export function PrivacyStatusIndicator({ className = '' }: PrivacyStatusIndicatorProps) {
    const { isConnected, isEnabled } = useZcashBridge({ enabled: ZCASH_CONFIG.ENABLED });

    if (!ZCASH_CONFIG.ENABLED || !ZCASH_CONFIG.SHIELDED_ADDRESS) {
        return null; // Don't show if not configured
    }

    const getStatusColor = () => {
        if (!isEnabled) return 'text-gray-500';
        if (isConnected) return 'text-green-400';
        return 'text-yellow-400';
    };

    const getStatusText = () => {
        if (!isEnabled) return 'Privacy: Disabled';
        if (isConnected) return 'Privacy: Active';
        return 'Privacy: Connecting...';
    };

    const getStatusIcon = () => {
        if (!isEnabled) return '🔓';
        if (isConnected) return '🔒';
        return '⏳';
    };

    return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
            <span className="text-lg">{getStatusIcon()}</span>
            <span className={getStatusColor()}>{getStatusText()}</span>
            {isConnected && (
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">Zcash Bridge</span>
                </div>
            )}
        </div>
    );
}

export default PrivacyStatusIndicator;