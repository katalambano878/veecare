'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type ModulesContextValue = {
    enabledModules: string[];
    loading: boolean;
    isModuleEnabled: (moduleId: string) => boolean;
};

const ModulesContext = createContext<ModulesContextValue>({
    enabledModules: [],
    loading: true,
    isModuleEnabled: () => false,
});

export function ModulesProvider({ children }: { children: ReactNode }) {
    const [enabledModules, setEnabledModules] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setLoading(false);
            return;
        }

        async function fetchModules() {
            try {
                const { data, error } = await supabase
                    .from('store_modules')
                    .select('id, enabled');

                if (error) {
                    console.warn('[ModulesContext] fetch failed:', error.message);
                    return;
                }

                setEnabledModules(
                    (data ?? []).filter((row) => row.enabled).map((row) => row.id),
                );
            } finally {
                setLoading(false);
            }
        }

        void fetchModules();
    }, []);

    const isModuleEnabled = (moduleId: string) => enabledModules.includes(moduleId);

    return (
        <ModulesContext.Provider value={{ enabledModules, loading, isModuleEnabled }}>
            {children}
        </ModulesContext.Provider>
    );
}

export function useModules() {
    return useContext(ModulesContext);
}
