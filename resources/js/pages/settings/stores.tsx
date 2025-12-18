import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Building2, Check, Users } from 'lucide-react';
import { ChangeEvent, FormEvent } from 'react';

type StoreUser = {
    id: number;
    name: string;
    email: string;
};

type StoreResource = {
    id: number;
    name: string;
    city?: string | null;
    status?: string | null;
    users: StoreUser[];
};

type StoresPageProps = {
    stores: StoreResource[];
    users: StoreUser[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Настройки', href: '/settings' },
    { title: 'Магазины', href: '/settings/stores' },
];

function StoreUsersForm({ store, users }: { store: StoreResource; users: StoreUser[] }) {
    const form = useForm<{ user_ids: number[] }>({
        user_ids: store.users.map((user) => user.id),
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(`/settings/stores/${store.id}/users`, {
            preserveScroll: true,
        });
    };

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(event.target.selectedOptions).map((option) => Number(option.value));
        form.setData('user_ids', selectedIds);
    };

    return (
        <form className="space-y-3" onSubmit={handleSubmit}>
            <Label htmlFor={`store-${store.id}-users`}>Доступ пользователей</Label>
            <select
                id={`store-${store.id}-users`}
                name="user_ids"
                multiple
                value={form.data.user_ids}
                onChange={handleChange}
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                    </option>
                ))}
            </select>
            {form.errors.user_ids && <p className="text-xs text-destructive">{form.errors.user_ids}</p>}
            <p className="text-xs text-muted-foreground">
                Владелец всегда видит все магазины, независимо от доступа в списке.
            </p>
            <Button type="submit" disabled={form.processing}>
                {form.processing ? 'Сохраняем...' : 'Сохранить доступы'}
            </Button>
        </form>
    );
}

export default function StoresPage({ stores, users }: StoresPageProps) {
    const { auth } = usePage<SharedData>().props;
    const createStoreForm = useForm({
        name: '',
        city: '',
        status: '',
    });

    const submitStore = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        createStoreForm.post('/settings/stores', {
            preserveScroll: true,
            onSuccess: () => createStoreForm.reset(),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Магазины" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-semibold">Магазины</h1>
                        <p className="text-sm text-muted-foreground">
                            Добавляйте точки продаж и управляйте доступом сотрудников
                        </p>
                    </div>

                    <Card className="border-border/80">
                        <CardHeader>
                            <CardTitle>Добавить магазин</CardTitle>
                            <CardDescription>Новый магазин сразу будет доступен вам и появится в переключателе</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="grid gap-4 md:grid-cols-3" onSubmit={submitStore}>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">Название</Label>
                                    <Input
                                        id="name"
                                        value={createStoreForm.data.name}
                                        onChange={(event) => createStoreForm.setData('name', event.target.value)}
                                        placeholder="Например, Цветы на Петроградке"
                                    />
                                    {createStoreForm.errors.name && (
                                        <p className="text-xs text-destructive">{createStoreForm.errors.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Город</Label>
                                    <Input
                                        id="city"
                                        value={createStoreForm.data.city}
                                        onChange={(event) => createStoreForm.setData('city', event.target.value)}
                                        placeholder="Санкт-Петербург"
                                    />
                                    {createStoreForm.errors.city && (
                                        <p className="text-xs text-destructive">{createStoreForm.errors.city}</p>
                                    )}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="status">Статус / примечание</Label>
                                    <Input
                                        id="status"
                                        value={createStoreForm.data.status}
                                        onChange={(event) => createStoreForm.setData('status', event.target.value)}
                                        placeholder="Открыт, Перерыв, Режим работы"
                                    />
                                    {createStoreForm.errors.status && (
                                        <p className="text-xs text-destructive">{createStoreForm.errors.status}</p>
                                    )}
                                </div>
                                <div className="flex items-end md:col-span-1">
                                    <Button type="submit" disabled={createStoreForm.processing} className="w-full">
                                        {createStoreForm.processing ? 'Создаём...' : 'Создать магазин'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardHeader>
                            <CardTitle>Доступы сотрудников</CardTitle>
                            <CardDescription>
                                Управляйте, какие пользователи видят конкретные магазины в переключателе
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {stores.length === 0 && <p className="text-sm text-muted-foreground">Магазинов пока нет</p>}

                            {stores.map((store) => (
                                <div key={store.id} className="rounded-lg border border-border/80 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-base font-semibold">
                                                <Building2 className="h-4 w-4" />
                                                {store.name}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {[store.city, store.status].filter(Boolean).join(' • ') || 'Без дополнительных данных'}
                                            </p>
                                            {store.users.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {store.users.map((user) => (
                                                        <Badge key={user.id} variant="secondary" className="gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {user.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-destructive">Нет назначенных пользователей</p>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="gap-1 self-start md:self-center">
                                            <Check className="h-3 w-3" />
                                            {auth.user.name} видит все магазины как владелец
                                        </Badge>
                                    </div>
                                    <div className="mt-4 border-t pt-4">
                                        <StoreUsersForm store={store} users={users} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
