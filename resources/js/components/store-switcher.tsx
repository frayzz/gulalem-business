import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { switchStore } from '@/routes';
import { type SharedData, type Store } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Building2, Check, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export function StoreSwitcher() {
    const { stores = [], currentStoreId } = usePage<SharedData>().props;
    const [pendingStoreId, setPendingStoreId] = useState<number | null>(null);

    const currentStore = useMemo<Store | undefined>(
        () => stores.find((store) => store.id === currentStoreId) ?? stores[0],
        [currentStoreId, stores],
    );

    if (!stores.length || !currentStore) {
        return null;
    }

    const handleSwitch = (storeId: number) => {
        if (storeId === currentStore.id) return;

        setPendingStoreId(storeId);

        router.post(
            switchStore(),
            { store_id: storeId },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setPendingStoreId(null),
            },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-dashed">
                    {pendingStoreId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Building2 className="h-4 w-4" />
                    )}
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                            Магазин
                        </span>
                        <span className="text-sm font-semibold leading-tight">{currentStore.name}</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Переключить магазин</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {stores.map((store) => (
                    <DropdownMenuItem
                        key={store.id}
                        onSelect={(event) => {
                            event.preventDefault();
                            handleSwitch(store.id);
                        }}
                        disabled={!!pendingStoreId}
                        className="flex items-start gap-3"
                    >
                        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                            {store.id === currentStore.id ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Building2 className="h-4 w-4" />
                            )}
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium leading-none">{store.name}</span>
                                {store.id === currentStore.id && <Badge variant="secondary">Текущий</Badge>}
                            </div>
                            {(store.city || store.status) && (
                                <p className="text-xs text-muted-foreground">
                                    {[store.city, store.status].filter(Boolean).join(' • ')}
                                </p>
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
