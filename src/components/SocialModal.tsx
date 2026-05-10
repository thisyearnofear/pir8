'use client';

import { useState, useEffect } from 'react';
import { useSafeWallet } from '@/components/SafeWalletProvider';
import { AgentArenaLeaderboard } from './AgentArenaLeaderboard';
import { LeaderboardManager, LeaderboardAgent } from '@/lib/leaderboard-manager';

interface SocialModalProps {
    type: 'leaderboard' | 'referral';
    gameId?: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function SocialModal({ type, gameId, isOpen, onClose }: SocialModalProps) {
    const { publicKey } = useSafeWallet();
    const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
    const [referralCode, setReferralCode] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && publicKey) {
            if (type === 'referral') {
                const code = publicKey.toString().slice(0, 8).toUpperCase();
                setReferralCode(code);
                const baseUrl = window.location.origin;
                const link = gameId ? `${baseUrl}?join=${gameId}&ref=${code}` : `${baseUrl}?ref=${code}`;
                setInviteLink(link);
            } else if (type === 'leaderboard') {
                const topAgents = LeaderboardManager.getTopAgents(10);
                setAgents(topAgents);
            }
        }
    }, [isOpen, publicKey, type, gameId]);

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = (platform: 'twitter' | 'discord') => {
        const shareText = type === 'referral'
            ? `🏴‍☠️ Join me in PIR8 - epic naval warfare on Solana! ⚔️\n${inviteLink}\n#PIR8Game #Web3Gaming`
            : `🏆 Check out my rank on the @PIR8Game leaderboard! #PIR8Game #Leaderboard`;

        if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        } else {
            handleCopy(shareText);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center z-modal"
            role="dialog" aria-modal="true">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                      rounded-3xl border-2 border-neon-cyan p-8 max-w-2xl w-full mx-4 
                      shadow-2xl shadow-neon-cyan/30 max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text 
                         bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-cyan">
                        {type === 'leaderboard' ? '🏆 GLOBAL LEADERBOARD' : '🚀 INVITE YOUR CREW'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">✕</button>
                </div>

                {type === 'leaderboard' ? (
                    <AgentArenaLeaderboard agents={agents} />
                ) : (
                    /* Referral Content */
                    <div className="space-y-6">
                        <div className="text-center bg-gradient-to-r from-neon-gold/20 to-neon-orange/20 
                            border-2 border-neon-gold rounded-xl p-4">
                            <div className="text-2xl font-black text-neon-gold mb-2">Your Referral Code</div>
                            <div className="font-mono text-xl font-bold text-white">{referralCode}</div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-neon-cyan mb-3">Invite Link</h3>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-3 
                                font-mono text-sm text-gray-300 break-all">
                                    {inviteLink}
                                </div>
                                <button onClick={() => handleCopy(inviteLink)}
                                    className="bg-neon-cyan hover:bg-neon-cyan/80 text-black font-bold px-4 py-3 
                                   rounded-lg transition-all hover:scale-105">
                                    {copied ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => handleShare('twitter')}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 
                                 rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2">
                                <span>🐦</span>
                                <span>Share on Twitter</span>
                            </button>
                            <button onClick={() => handleShare('discord')}
                                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 
                                 rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2">
                                <span>💬</span>
                                <span>Copy for Discord</span>
                            </button>
                        </div>
                    </div>
                )}

                {copied && (
                    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg 
                          font-bold animate-in slide-in-from-right duration-300">
                        ✓ Copied to clipboard!
                    </div>
                )}
            </div>
        </div>
    );
}