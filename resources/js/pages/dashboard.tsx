import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { AlertTriangle, Banknote, CalendarClock, CheckCircle2, ClipboardList, Leaf, PackageSearch, Users } from 'lucide-react';

interface DashboardProps extends PageProps {
    orders: OrderResource[];
    inventory: InventoryResource[];
    paymentsToday: number;
    ordersToday: number;
    completedToday: number;
    crmSummary: CrmSummary;
    pipeline: PipelineItem[];
    inventoryAlerts: InventoryAlerts;
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

interface CrmSummary {
    activeOrders: number;
    upcomingDeliveries: number;
    unpaidTotal: number;
    newCustomers: number;
    totalCustomers: number;
}

interface PipelineItem {
    status: string;
    total: number;
}

interface InventoryAlerts {
    expiringSoon: number;
    lowStock: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

const statusLabels: Record<string, string> = {
    new: 'Новый',
    in_progress: 'В работе',
    processing: 'В работе',
    ready: 'Готов',
    delivered: 'Доставлен',
    completed: 'Завершён',
    cancelled: 'Отменён',
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

function formatNumber(value: number) {
    return new Intl.NumberFormat('ru-RU').format(value);
}

export default function Dashboard({
    auth,
    orders,
    inventory,
    paymentsToday,
    ordersToday,
    completedToday,
    crmSummary,
    pipeline,
    inventoryAlerts,
}: DashboardProps) {
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

    const pipelineTotals = pipeline.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = item.total;
        return acc;
    }, {});

    const basePipelineStatuses = ['new', 'in_progress', 'ready', 'delivered', 'completed', 'cancelled'];
    const pipelineStatuses = [
        ...basePipelineStatuses,
        ...pipeline.map((item) => item.status).filter((status) => !basePipelineStatuses.includes(status)),
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

                <section className="grid gap-4 lg:grid-cols-3" id="crm">
                    <Card className="border-border/80">
                        <CardHeader>
                            <CardTitle>CRM и операции</CardTitle>
                            <CardDescription>Срез по воронке и оплатам без фильтров</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                                <ClipboardList className="mt-1 h-4 w-4 text-primary" />
                                <div>
                                    <p className="font-medium">Активные заказы</p>
                                    <p className="text-muted-foreground">
                                        {formatNumber(crmSummary.activeOrders)} в работе, пока не закрыты как «Завершён»
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                                <Banknote className="mt-1 h-4 w-4 text-primary" />
                                <div>
                                    <p className="font-medium">Долг по оплате</p>
                                    <p className="text-muted-foreground">
                                        {crmSummary.unpaidTotal === 0
                                            ? 'Все заказы закрыты по оплате'
                                            : `${formatCurrency(crmSummary.unpaidTotal)} нужно оплатить`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                                <CalendarClock className="mt-1 h-4 w-4 text-primary" />
                                <div>
                                    <p className="font-medium">Ближайшие доставки</p>
                                    <p className="text-muted-foreground">
                                        {formatNumber(crmSummary.upcomingDeliveries)} с назначенным временем
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardHeader>
                            <CardTitle>Клиентская база</CardTitle>
                            <CardDescription>Обновляется автоматически из заказов</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                                <Users className="mt-1 h-4 w-4 text-primary" />
                                <div>
                                    <p className="font-medium">Всего клиентов</p>
                                    <p className="text-muted-foreground">{formatNumber(crmSummary.totalCustomers)} записей</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                                <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                                <div>
                                    <p className="font-medium">Новые за 7 дней</p>
                                    <p className="text-muted-foreground">{formatNumber(crmSummary.newCustomers)} клиента(ов)</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Роли пока не ограничивают просмотр дашборда — данные видны всем авторизованным пользователям.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardHeader>
                            <CardTitle>Контроль склада</CardTitle>
                            <CardDescription>Основано на партиях и сроках годности</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                                <AlertTriangle className="mt-1 h-4 w-4 text-primary" />
                                <div>
                                    <p className="font-medium">Просрочка в ближайшие 3 дня</p>
                                    <p className="text-muted-foreground">{formatNumber(inventoryAlerts.expiringSoon)} партий</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                                <PackageSearch className="mt-1 h-4 w-4 text-primary" />
                                <div>
                                    <p className="font-medium">Малый остаток (&lt; 5 шт.)</p>
                                    <p className="text-muted-foreground">{formatNumber(inventoryAlerts.lowStock)} позиций</p>
                                </div>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="mt-1">
                                <Link href="/inventory">Открыть склад</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                <Card className="border-border/80" id="pipeline">
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Воронка заказов</CardTitle>
                            <CardDescription>Контроль статусов и скорости прохождения</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/orders">Управлять заказами</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                        {pipelineStatuses.map((status) => (
                            <div key={status} className="rounded-lg border bg-muted/30 px-3 py-2">
                                <p className="text-sm font-medium">{statusLabels[status] ?? status}</p>
                                <p className="text-lg font-semibold">{formatNumber(pipelineTotals[status] ?? 0)}</p>
                                <p className="text-xs text-muted-foreground">Всего заказов со статусом</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

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

                <Card className="border-border/80" id="how-to-fill">
                    <CardHeader>
                        <CardTitle>Как наполнить дашборд данными</CardTitle>
                        <CardDescription>
                            Добавьте реальные заказы, партии и комментарии — показатели обновятся мгновенно
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                            <p className="font-medium">Создайте заказ</p>
                            <p className="text-muted-foreground">
                                Из карточки заказа попадут воронка, оплаты и заметки клиентов.
                            </p>
                            <Button asChild size="sm">
                                <Link href="/orders">Перейти в заказы</Link>
                            </Button>
                        </div>
                        <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                            <p className="font-medium">Заведите приход на склад</p>
                            <p className="text-muted-foreground">
                                Партии с датой поступления и сроком годности попадут в блок «Склад» и контроль просрочки.
                            </p>
                            <Button asChild size="sm" variant="secondary">
                                <Link href="/inventory">Открыть склад</Link>
                            </Button>
                        </div>
                        <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                            <p className="font-medium">Фиксируйте комментарии</p>
                            <p className="text-muted-foreground">
                                Любые примечания клиентов появятся в блоке «Комментарии из заказов».
                            </p>
                            <Button asChild size="sm" variant="outline">
                                <Link href="/comments">Перейти в комментарии</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

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
