import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { Banknote, ClipboardList, Leaf, PackageSearch } from 'lucide-react';

interface DashboardProps extends PageProps {
    orders: OrderResource[];
    inventory: InventoryResource[];
    paymentsToday: number;
    ordersToday: number;
    completedToday: number;
}

interface OrderResource {
    id: number;
    customer?: string | null;
    total: number;
    status: string;
    delivery_type: string;
    payment_status: string;
    paid_total: number;
    created_at: string;
    delivery_time?: string | null;
    notes?: string | null;
}

interface InventoryResource {
    id: number;
    product?: string | null;
    qty_left: number;
    expires_at?: string | null;
    arrived_at?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

const statusLabels: Record<string, string> = {
    new: 'Новый',
    processing: 'В работе',
    ready: 'Готов',
    delivered: 'Доставлен',
    completed: 'Завершён',
};

const deliveryLabels: Record<string, string> = {
    pickup: 'Самовывоз',
    courier: 'Доставка',
    shipping: 'Отправка',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
    }).format(value);
}

export default function Dashboard({ auth, orders, inventory, paymentsToday, ordersToday, completedToday }: DashboardProps) {
    const summaryCards = [
        {
            title: 'Выручка сегодня',
            value: formatCurrency(paymentsToday),
            description: `${ordersToday} заказов за день`,
            icon: Banknote,
        },
        {
            title: 'Закрыто',
            value: completedToday,
            description: 'Заказы со статусом «Завершён»',
            icon: ClipboardList,
        },
        {
            title: 'Партии на складе',
            value: inventory.length,
            description: 'Отсортированы по сроку годности',
            icon: PackageSearch,
        },
    ];

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Дашборд</h1>
                        <p className="text-sm text-muted-foreground">
                            Живые данные из заказов, оплат и партий на складе
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/orders">Открыть заказы</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/inventory">Склад</Link>
                        </Button>
                    </div>
                </div>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="reports">
                    {summaryCards.map((card) => (
                        <Card key={card.title} className="border-border/80">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-2">
                                    <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
                                    <div className="text-2xl font-semibold">{card.value}</div>
                                    <CardDescription>{card.description}</CardDescription>
                                </div>
                                <card.icon className="h-8 w-8 text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-4 lg:grid-cols-2" id="orders">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Последние заказы</CardTitle>
                                <CardDescription>Сводка по статусу и оплате</CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/orders">Все заказы</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Клиент</TableHead>
                                        <TableHead>Доставка</TableHead>
                                        <TableHead>Создан</TableHead>
                                        <TableHead>Сумма</TableHead>
                                        <TableHead>Оплата</TableHead>
                                        <TableHead>Статус</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.id}</TableCell>
                                            <TableCell>{order.customer ?? 'Без имени'}</TableCell>
                                            <TableCell>{deliveryLabels[order.delivery_type] ?? order.delivery_type}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleString('ru-RU')}
                                            </TableCell>
                                            <TableCell>{formatCurrency(order.total)}</TableCell>
                                            <TableCell>
                                                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                    {order.payment_status === 'paid'
                                                        ? 'Оплачено'
                                                        : `Оплачено ${formatCurrency(order.paid_total)}`}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{statusLabels[order.status] ?? order.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card id="inventory">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Склад</CardTitle>
                                <CardDescription>Партии с наименьшим сроком годности сверху</CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/inventory">К списку</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {inventory.length === 0 && (
                                <p className="text-sm text-muted-foreground">Нет активных партий.</p>
                            )}
                            {inventory.map((batch) => (
                                <div
                                    key={batch.id}
                                    className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-md bg-primary/10 p-2 text-primary">
                                            <Leaf className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="font-medium">{batch.product ?? 'Без названия'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Поступление {batch.arrived_at ? new Date(batch.arrived_at).toLocaleDateString('ru-RU') : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary">{batch.qty_left}</Badge>
                                        <p className="text-xs text-muted-foreground">
                                            Годен до {batch.expires_at ? new Date(batch.expires_at).toLocaleDateString('ru-RU') : '—'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Комментарии из заказов</CardTitle>
                            <CardDescription>Все замечания клиентов доступны на странице комментов</CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/comments">Открыть</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {orders.filter((order) => order.notes).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Пока нет комментариев. Добавьте заметки в заказах, чтобы увидеть их здесь.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {orders
                                    .filter((order) => order.notes)
                                    .slice(0, 3)
                                    .map((order) => (
                                        <li key={order.id} className="rounded-lg border bg-muted/30 p-3">
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span>Заказ #{order.id}</span>
                                                <span>{new Date(order.created_at).toLocaleDateString('ru-RU')}</span>
                                            </div>
                                            <p className="mt-1 text-sm">{order.notes}</p>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
