import { create } from 'zustand';

interface BreadcrumbStore {
    names: Record<string, string>;
    setBreadcrumbName: (id: string, name: string) => void;
    removeBreadcrumbName: (id: string) => void;
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
    names: {},
    setBreadcrumbName: (id, name) =>
        set((state) => ({ names: { ...state.names, [id]: name } })),
    removeBreadcrumbName: (id) =>
        set((state) => {
            const newNames = { ...state.names };
            delete newNames[id];
            return { names: newNames };
        })
}));
