/**
 * usePrivacySimulation Hook
 * 
 * Manages privacy simulation state for practice mode,
 * integrating the PrivacySimulator with React state.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    PrivacySimulator,
    InformationLeakageReport,
    PlayerDossier,
    PrivacyLesson,
    GhostFleetStatus,
    getPrivacySimulator,
    resetPrivacySimulator,
} from '@/lib/privacySimulation';
import { GameState, GameAction, Player } from '@/types/game';

// Type for simulation mode
type PrivacySimulationMode = 'transparent' | 'ghost_fleet';

interface UsePrivacySimulationOptions {
    enabled?: boolean;
    autoShowLessons?: boolean;
}

interface UsePrivacySimulationReturn {
    // State
    simulator: PrivacySimulator | null;
    leakageReport: InformationLeakageReport | null;
    dossier: PlayerDossier | null;
    ghostFleetStatus: GhostFleetStatus | null;
    currentLesson: PrivacyLesson | null;
    isLessonVisible: boolean;
    mode: PrivacySimulationMode;
    turnNumber: number;

    // Actions
    initialize: () => void;
    reset: () => void;
    updateLeakage: (gameState: GameState, humanPlayer: Player, recentActions: GameAction[]) => void;
    recordAction: (action: GameAction) => void;
    activateGhostFleet: () => void;
    dismissLesson: () => void;
    showDossier: () => void;
    hideDossier: () => void;
    isDossierVisible: boolean;
    incrementTurn: () => void;
}

export function usePrivacySimulation(
    options: UsePrivacySimulationOptions = {}
): UsePrivacySimulationReturn {
    const { enabled = true, autoShowLessons = true } = options;

    // Core simulator instance (stored in ref to persist across renders)
    const simulatorRef = useRef<PrivacySimulator | null>(null);

    // UI State
    const [leakageReport, setLeakageReport] = useState<InformationLeakageReport | null>(null);
    const [dossier, setDossier] = useState<PlayerDossier | null>(null);
    const [ghostFleetStatus, setGhostFleetStatus] = useState<GhostFleetStatus | null>(null);
    const [currentLesson, setCurrentLesson] = useState<PrivacyLesson | null>(null);
    const [isLessonVisible, setIsLessonVisible] = useState(false);
    const [isDossierVisible, setIsDossierVisible] = useState(false);
    const [mode, setMode] = useState<PrivacySimulationMode>('transparent');
    const [turnNumber, setTurnNumber] = useState(0);

    // Initialize simulator
    const initialize = useCallback(() => {
        if (!enabled) return;

        // Create new simulator instance
        simulatorRef.current = getPrivacySimulator(true);

        // Sync React state with simulator
        syncState();
    }, [enabled]);

    // Sync React state with simulator state
    const syncState = useCallback(() => {
        if (!simulatorRef.current) return;

        const state = simulatorRef.current.getState();
        setMode(state.ghostFleet.isActive ? 'ghost_fleet' : 'transparent');
        setGhostFleetStatus(state.ghostFleet);
        setDossier(state.playerDossier);
        setLeakageReport(state.informationLeakage);
    }, []);

    // Reset simulator
    const reset = useCallback(() => {
        if (simulatorRef.current) {
            simulatorRef.current.reset();
            syncState();
        }
        resetPrivacySimulator();
        setTurnNumber(0);
    }, [syncState]);

    // Update leakage calculation
    const updateLeakage = useCallback((
        gameState: GameState,
        humanPlayer: Player,
        recentActions: GameAction[]
    ) => {
        if (!simulatorRef.current || !enabled) return;

        const report = simulatorRef.current.calculateLeakage(
            gameState,
            humanPlayer,
            recentActions
        );
        setLeakageReport(report);
    }, [enabled]);

    // Record player action
    const recordAction = useCallback((action: GameAction) => {
        if (!simulatorRef.current || !enabled) return;

        simulatorRef.current.updateDossier([action]);
        syncState();
    }, [enabled, syncState]);

    // Activate Ghost Fleet
    const activateGhostFleet = useCallback(() => {
        if (!simulatorRef.current) return;

        const success = simulatorRef.current.activateGhostFleet();
        if (success) {
            syncState();
            setIsLessonVisible(false);
        }
    }, [syncState]);

    // Dismiss current lesson
    const dismissLesson = useCallback(() => {
        setIsLessonVisible(false);
        setCurrentLesson(null);
    }, []);

    // Show/hide dossier
    const showDossier = useCallback(() => {
        setIsDossierVisible(true);
    }, []);

    const hideDossier = useCallback(() => {
        setIsDossierVisible(false);
    }, []);

    // Increment turn (call this when turn advances)
    const incrementTurn = useCallback(() => {
        setTurnNumber(prev => {
            const newTurn = prev + 1;

            // Process turn end in simulator
            if (simulatorRef.current) {
                simulatorRef.current.processTurnEnd();
                syncState();
            }

            return newTurn;
        });
    }, [syncState]);

    // Check for lessons when turn changes
    // NOTE: Auto-showing lessons is disabled to avoid interrupting gameplay.
    // Users can still view lessons manually through the privacy education panel.
    useEffect(() => {
        // Lessons are no longer auto-displayed to prevent UI interruptions
        // This was requested by users who found the modal popups disruptive
    }, [turnNumber, autoShowLessons]);

    // Initialize on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    return {
        // State
        simulator: simulatorRef.current,
        leakageReport,
        dossier,
        ghostFleetStatus,
        currentLesson,
        isLessonVisible,
        mode,
        turnNumber,

        // Actions
        initialize,
        reset,
        updateLeakage,
        recordAction,
        activateGhostFleet,
        dismissLesson,
        showDossier,
        hideDossier,
        isDossierVisible,
        incrementTurn,
    };
}

export default usePrivacySimulation;
