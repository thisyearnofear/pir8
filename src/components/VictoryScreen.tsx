'use client';

/**
 * VictoryScreen — the closing entry of the captain's log.
 *
 * Token-native rewrite of the neon celebration modal. This is the one
 * moment of theatre the game is allowed, and it now happens in the world's
 * own materials: the proclamation in world type, the battle's tale as a
 * logbook quote, standings as final ledger entries. The canvas confetti
 * stays (a celebration is content, not chrome); the fifty absolutely
 * positioned emoji raining at random rotation are gone. Share, replay,
 * practice upsell, and reduced-motion behavior are all preserved.
 */

import { useEffect, useState } from 'react';
import { GameState } from '../types/game';
import { ConfettiCelebration } from './effects/ConfettiCelebration';
import { useAccessibility } from '../hooks/useAccessibility';
import { useReplayPersistence } from '@/hooks/useReplayPersistence';
import { buildBattleMoment } from '@/lib/battleMoments';
import { buildAmbushShareText, buildChallengeUrl } from '@/lib/shareLinks';
import { Icon } from './ui/Icon';

interface VictoryScreenProps {
    gameState: GameState | null;
    currentPlayerPK?: string;
    onNewGame: () => void;
    onReturnToLobby: () => void;
    isPracticeMode?: boolean;
}

function LedgerRow({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
    return (
        <div className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
            <span className="p8-label">{label}</span>
            <span className={`p8-value ${tone ?? ''}`} style={{ fontSize: 'var(--p8-fs-md)' }}>
                {value}
            </span>
        </div>
    );
}

export default function VictoryScreen({
    gameState,
    currentPlayerPK,
    onNewGame,
    onReturnToLobby,
    isPracticeMode = false
}: VictoryScreenProps) {
    const [showConfetti, setShowConfetti] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareText, setShareText] = useState('');
    const [epicMoment, setEpicMoment] = useState('');
    const [copied, setCopied] = useState(false);
    const { reducedMotion } = useAccessibility();

    const winner = gameState?.players.find(p => p.publicKey === gameState?.winner);
    const { replayUrl } = useReplayPersistence({
        gameState,
        winnerPublicKey: winner?.publicKey,
    });

    useEffect(() => {
        if (gameState?.gameStatus === 'completed') {
            const animationDelay = reducedMotion ? 0 : 1500;
            const confettiDuration = reducedMotion ? 0 : 8000;

            setShowConfetti(!reducedMotion);
            setTimeout(() => setShowStats(true), animationDelay);
            if (!reducedMotion) {
                setTimeout(() => setShowConfetti(false), confettiDuration);
            }

            generateEpicContent();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState?.gameStatus, reducedMotion, replayUrl]);

    const generateEpicContent = async () => {
        if (!gameState) return;

        const winnerPlayer = gameState.players.find(p => p.publicKey === gameState.winner);
        const isWinnerNow = winnerPlayer?.publicKey === currentPlayerPK;
        const winnerName = winnerPlayer?.username || 'Anonymous Pirate';
        const moment = buildBattleMoment(gameState, winnerPlayer?.publicKey);

        setEpicMoment(`${moment.title}: ${moment.summary}`);

        const shareUrl = replayUrl || buildChallengeUrl({ gameId: gameState.gameId });

        const challengeText = buildAmbushShareText({
            url: shareUrl,
            winnerName,
            turnNumber: moment.turnNumber,
            shipsDestroyed: moment.shipsDestroyed,
            territoriesControlled: moment.territoriesControlled,
            gold: moment.gold,
            isWinner: isWinnerNow,
        });

        setShareText(challengeText);
    };

    const handleShare = async (platform: 'twitter' | 'copy') => {
        if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        } else {
            navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        if (platform === 'twitter') setShowShareModal(false);
    };

    if (!gameState || gameState.gameStatus !== 'completed') {
        return null;
    }

    const isWinner = winner?.publicKey === currentPlayerPK;
    const currentPlayer = gameState.players.find(p => p.publicKey === currentPlayerPK);

    const calculateStats = () => {
        const stats = gameState.players.map(player => {
            const fleetPower = player.ships.reduce((total, ship) => total + ship.health, 0);
            const resourceValue =
                player.resources.gold +
                (player.resources.crew * 5) +
                (player.resources.cannons * 10) +
                (player.resources.supplies * 2);

            return {
                ...player,
                fleetPower,
                resourceValue,
                territoryCount: player.controlledTerritories.length
            };
        });

        return stats.sort((a, b) => {
            if (a.publicKey === gameState.winner) return -1;
            if (b.publicKey === gameState.winner) return 1;
            return b.totalScore - a.totalScore;
        });
    };

    const finalStats = calculateStats();
    const playerRank = finalStats.findIndex(p => p.publicKey === currentPlayerPK) + 1;
    const rankSuffix = playerRank === 1 ? 'st' : playerRank === 2 ? 'nd' : playerRank === 3 ? 'rd' : 'th';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={isWinner ? 'Victory — you are the pirate king' : 'Battle complete'}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'color-mix(in srgb, var(--p8-ink) 92%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 'var(--p8-z-modal, 60)',
                overflowY: 'auto',
                padding: 'var(--p8-space-3)',
            }}
        >
            {showConfetti && <ConfettiCelebration isActive={showConfetti} />}

            <div
                className="p8-instrument"
                style={{
                    maxWidth: 'calc(640 * var(--p8-u))',
                    width: '100%',
                    padding: 'var(--p8-space-4)',
                    borderColor: isWinner ? 'color-mix(in srgb, var(--p8-lamp) 60%, transparent)' : undefined,
                    position: 'relative',
                }}
            >
                {/* The proclamation — world type carries the theatre */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--p8-space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--p8-space-1)' }}>
                        <Icon
                            name={isWinner ? 'crown' : 'trophy'}
                            size={32}
                            className={isWinner ? 'p8-text-lamp' : 'p8-text-dim'}
                        />
                    </div>
                    <h1
                        className="p8-world"
                        style={{
                            fontSize: 'var(--p8-fs-xl)',
                            color: isWinner ? 'var(--p8-lamp)' : 'var(--p8-vellum)',
                            marginBottom: 'var(--p8-space-1)',
                        }}
                    >
                        {isWinner ? 'Pirate King' : 'Battle Complete'}
                    </h1>
                    <p
                        className="p8-text-dim"
                        style={{ fontSize: 'var(--p8-fs-md)', fontFamily: 'var(--p8-font-ui)' }}
                    >
                        {isWinner
                            ? 'You have conquered the seven seas'
                            : `${winner?.username || winner?.publicKey?.slice(0, 8) || 'Unknown'} claims the crown`}
                    </p>
                    {!isWinner && (
                        <p
                            className="p8-text-mute"
                            style={{ fontSize: 'var(--p8-fs-sm)', fontFamily: 'var(--p8-font-ui)', marginTop: 'calc(2 * var(--p8-u))' }}
                        >
                            You finished in {playerRank}{rankSuffix} place
                        </p>
                    )}

                    {epicMoment && (
                        <blockquote
                            className="p8-world"
                            style={{
                                marginTop: 'var(--p8-space-2)',
                                padding: 'var(--p8-space-2)',
                                fontSize: 'var(--p8-fs-md)',
                                fontStyle: 'italic',
                                color: 'var(--p8-vellum-dim)',
                                borderLeft: 'calc(2 * var(--p8-u)) solid var(--p8-brass)',
                                textAlign: 'left',
                            }}
                        >
                            {epicMoment}
                        </blockquote>
                    )}
                </div>

                {/* Victory details + personal performance */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(calc(200 * var(--p8-u)), 1fr))',
                        gap: 'var(--p8-space-2)',
                        marginBottom: 'var(--p8-space-3)',
                    }}
                >
                    {winner && (
                        <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
                            <div className="p8-cell-row" style={{ marginBottom: 'var(--p8-space-1)' }}>
                                <Icon name="trophy" size={13} className="p8-text-lamp" />
                                <span className="p8-label">Victory achieved</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(3 * var(--p8-u))' }}>
                                <LedgerRow label="Dominance" value={winner.totalScore} tone="p8-text-lamp" />
                                <LedgerRow label="Territories" value={winner.controlledTerritories.length} />
                                <LedgerRow label="Gold plundered" value={winner.resources.gold.toLocaleString()} />
                                <LedgerRow
                                    label="Fleet power"
                                    value={winner.ships.reduce((total, ship) => total + ship.health, 0)}
                                />
                            </div>
                        </div>
                    )}

                    {currentPlayer && (
                        <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)' }}>
                            <div className="p8-cell-row" style={{ marginBottom: 'var(--p8-space-1)' }}>
                                <Icon name="stats" size={13} className="p8-text-dim" />
                                <span className="p8-label">Your performance</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(3 * var(--p8-u))' }}>
                                <LedgerRow label="Final rank" value={`#${playerRank}`} />
                                <LedgerRow label="Ships built" value={currentPlayer.ships.length} />
                                <LedgerRow label="Territories" value={currentPlayer.controlledTerritories.length} />
                                <LedgerRow
                                    label="Speed bonus"
                                    value={`+${currentPlayer.speedBonusAccumulated || 0}`}
                                    tone="p8-text-signal"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Final standings — the ledger's closing entries */}
                {showStats && (
                    <div style={{ marginBottom: 'var(--p8-space-3)' }}>
                        <div className="p8-cell-row" style={{ justifyContent: 'center', marginBottom: 'var(--p8-space-1)' }}>
                            <span className="p8-label">Final standings</span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--p8-space-1)',
                                maxHeight: 'calc(220 * var(--p8-u))',
                                overflowY: 'auto',
                            }}
                        >
                            {finalStats.map((player, index) => {
                                const isMe = player.publicKey === currentPlayerPK;
                                return (
                                    <div
                                        key={player.publicKey}
                                        className="p8-instrument"
                                        style={{
                                            padding: 'var(--p8-space-1) var(--p8-space-2)',
                                            borderLeft: index === 0
                                                ? 'calc(2 * var(--p8-u)) solid var(--p8-lamp)'
                                                : undefined,
                                        }}
                                    >
                                        <div className="p8-cell-row" style={{ justifyContent: 'space-between' }}>
                                            <span className="p8-cell-row" style={{ minWidth: 0 }}>
                                                {index === 0 ? (
                                                    <Icon name="crown" size={13} className="p8-text-lamp" label="Winner" />
                                                ) : (
                                                    <span className="p8-value p8-text-mute" style={{ fontSize: 'var(--p8-fs-xs)' }}>
                                                        {index + 1}
                                                    </span>
                                                )}
                                                <span
                                                    className="p8-world"
                                                    style={{
                                                        fontSize: 'var(--p8-fs-md)',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {player.username || `${player.publicKey.slice(0, 6)}…${player.publicKey.slice(-4)}`}
                                                </span>
                                                {isMe && (
                                                    <span className="p8-chip" style={{ padding: '0 calc(3 * var(--p8-u))' }}>
                                                        you
                                                    </span>
                                                )}
                                            </span>
                                            <span className="p8-cell-row">
                                                <span className="p8-value p8-text-dim" style={{ fontSize: 'var(--p8-fs-xs)' }}>
                                                    {player.territoryCount} terr · {player.fleetPower} fleet · {player.resourceValue} res
                                                </span>
                                                <span className="p8-value p8-text-lamp" style={{ fontSize: 'var(--p8-fs-md)' }}>
                                                    {player.totalScore}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Practice upsell */}
                {isPracticeMode && (
                    <div className="p8-instrument" style={{ padding: 'var(--p8-space-2)', marginBottom: 'var(--p8-space-3)' }}>
                        <div className="p8-cell-row" style={{ marginBottom: 'calc(3 * var(--p8-u))' }}>
                            <Icon name="link" size={13} className="p8-text-lamp" />
                            <span className="p8-label" style={{ color: 'var(--p8-lamp)' }}>
                                Ready for real battles?
                            </span>
                        </div>
                        <p
                            className="p8-text-dim"
                            style={{ fontSize: 'var(--p8-fs-sm)', fontFamily: 'var(--p8-font-ui)' }}
                        >
                            Connect a Solana wallet to compete on-chain for real rankings, rewards, and glory.
                        </p>
                    </div>
                )}

                {/* Actions — the lever is the one primary */}
                <div style={{ display: 'flex', gap: 'var(--p8-space-2)', flexWrap: 'wrap' }}>
                    <button onClick={onReturnToLobby} className="p8-btn" style={{ flex: 1, minWidth: 'calc(120 * var(--p8-u))' }}>
                        <Icon name="anchor" size={14} />
                        Return to harbor
                    </button>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="p8-btn"
                        style={{ flex: 1, minWidth: 'calc(120 * var(--p8-u))' }}
                    >
                        <Icon name="message" size={14} />
                        Share challenge
                    </button>
                    <button onClick={onNewGame} className="p8-lever" style={{ flex: 2, minWidth: 'calc(140 * var(--p8-u))' }}>
                        <Icon name="attack" size={15} />
                        Battle again
                    </button>
                </div>

                <p
                    className="p8-text-mute"
                    style={{
                        textAlign: 'center',
                        marginTop: 'var(--p8-space-2)',
                        fontSize: 'var(--p8-fs-xs)',
                        fontFamily: 'var(--p8-font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {gameState.turnNumber} strategic turns
                </p>
            </div>

            {/* Share modal — a smaller ledger above the closing entry */}
            {showShareModal && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'color-mix(in srgb, var(--p8-ink) 85%, transparent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--p8-space-3)',
                    }}
                    onClick={() => setShowShareModal(false)}
                >
                    <div
                        className="p8-instrument"
                        style={{ maxWidth: 'calc(380 * var(--p8-u))', width: '100%', padding: 'var(--p8-space-3)' }}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-label="Share the challenge"
                    >
                        <div className="p8-cell-row" style={{ justifyContent: 'center', marginBottom: 'var(--p8-space-2)' }}>
                            <span className="p8-label">Share the challenge</span>
                        </div>

                        <div
                            className="p8-text-dim"
                            style={{
                                padding: 'var(--p8-space-2)',
                                background: 'var(--p8-ink)',
                                borderRadius: 'var(--p8-radius)',
                                border: 'var(--p8-hairline) solid var(--p8-brass-line)',
                                fontSize: 'var(--p8-fs-xs)',
                                fontFamily: 'var(--p8-font-ui)',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                marginBottom: 'var(--p8-space-2)',
                            }}
                        >
                            {shareText}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--p8-space-1)' }}>
                            <button onClick={() => handleShare('twitter')} className="p8-btn" style={{ width: '100%' }}>
                                <Icon name="link" size={14} />
                                Share on X
                            </button>
                            <button onClick={() => handleShare('copy')} className="p8-btn" style={{ width: '100%' }}>
                                <Icon name={copied ? 'check' : 'box'} size={14} />
                                {copied ? 'Copied' : 'Copy to clipboard'}
                            </button>
                            <button onClick={() => setShowShareModal(false)} className="p8-btn" style={{ width: '100%' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
