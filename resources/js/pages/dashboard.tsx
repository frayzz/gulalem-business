import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    Leaf,
    PackageSearch,
    Timer,
    Truck,
    Users,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface DashboardProps extends PageProps {
    orders: OrderResource[];
    inventory: InventoryResource[];
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

type PipelineStatus =
    | 'draft'
    | 'confirmed'
    | 'in_assembly'
    | 'ready'
    | 'delivered'
    | 'canceled'
    | string;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

const statusLabels: Record<string, string> = {
    draft: 'Черновик',
    confirmed: 'Подтверждён',
    in_assembly: 'Сборка',
    ready: 'Готов',
    delivered: 'Доставлен',
    canceled: 'Отменён',
};

const statusHints: Record<string, string> = {
    draft: 'Примите заказ и подтвердите состав',
    confirmed: 'Резерв материалов создан',
    in_assembly: 'Сборка и подготовка букета',
    ready: 'Ожидает передачи или выдачи',
    delivered: 'Заказ доставлен клиенту',
};

const statusActions: Record<string, string> = {
    draft: 'Подтвердить',
    confirmed: 'Отправить в сборку',
    in_assembly: 'Отметить готов',
    ready: 'Передать клиенту/курьеру',
    delivered: 'Доставлен',
    canceled: 'Отменён',
};

const statusFlow: PipelineStatus[] = ['draft', 'confirmed', 'in_assembly', 'ready', 'delivered'];

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
    ordersToday,
    completedToday,
    crmSummary,
    pipeline,
    inventoryAlerts,
}: DashboardProps) {
    const [orderCards, setOrderCards] = useState<OrderResource[]>(orders);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    const orderForm = useForm({
        customer_name: '',
        customer_phone: '',
        delivery_type: 'pickup',
        total: '',
        notes: '',
    });

    useEffect(() => {
        setOrderCards(orders);
    }, [orders]);

    const submitOrder = (event: FormEvent) => {
        event.preventDefault();

        orderForm.post('/orders', {
            preserveScroll: true,
            onSuccess: () => {
                orderForm.reset();
                setCreateModalOpen(false);
            },
        });
    };

    const pipelineStatuses = useMemo(() => {
        const unique = new Set<PipelineStatus>([
            ...statusFlow,
            ...pipeline.map((item) => item.status as PipelineStatus),
            ...orderCards.map((order) => order.status as PipelineStatus),
        ]);

        return Array.from(unique);
    }, [orderCards, pipeline]);

    const sortedStatuses = useMemo(
        () => [
            ...statusFlow,
            ...pipelineStatuses.filter((status) => !statusFlow.includes(status)).sort(),
        ],
        [pipelineStatuses],
    );

    const pipelineTotals = useMemo(() => {
        const totals: Record<PipelineStatus, number> = {};

        orderCards.forEach((order) => {
            const status = order.status as PipelineStatus;
            totals[status] = (totals[status] ?? 0) + 1;
        });

        return totals;
    }, [orderCards]);

    const boardColumns = useMemo(
        () =>
            sortedStatuses.map((status) => ({
                status,
                orders: orderCards.filter((order) => order.status === status),
            })),
        [orderCards, sortedStatuses],
    );

    const activeInProgress = useMemo(
        () =>
            (pipelineTotals.draft ?? 0) +
            (pipelineTotals.confirmed ?? 0) +
            (pipelineTotals.in_assembly ?? 0),
        [pipelineTotals],
    );

    const readyToHandOff = useMemo(
        () => pipelineTotals.ready ?? 0,
        [pipelineTotals],
    );

    const getNextStatus = (current: PipelineStatus) => {
        const currentIndex = statusFlow.indexOf(current);

        if (currentIndex === -1 || currentIndex === statusFlow.length - 1) return undefined;

        return statusFlow[currentIndex + 1];
    };

    const handleAdvanceStatus = (id: number, currentStatus: PipelineStatus) => {
        const next = getNextStatus(currentStatus);

        if (!next) return;

        setOrderCards((prev) =>
            prev.map((order) => (order.id === id ? { ...order, status: next } : order)),
        );

        router.post(
            `/orders/${id}/status`,
            { status: next },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () =>
                    setOrderCards((prev) =>
                        prev.map((order) => (order.id === id ? { ...order, status: currentStatus } : order)),
                    ),
            },
        );
    };

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-6 px-4 pb-8 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-r from-background via-background/80 to-background/60 p-4 shadow-sm sm:p-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                            <span className="inline-flex h-6 items-center rounded-md bg-primary/10 px-2 text-primary">CRM</span>
                            Живой борд смены
                        </div>
                        <h1 className="text-3xl font-semibold leading-tight">Рабочий день магазина</h1>
                        <p className="max-w-3xl text-sm text-muted-foreground">
                            Воронка заказов, оплаты и партии на складе в одном экране. Карточки можно двигать по статусам —
                            как в привычной CRM.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="rounded-full">Закрыто сегодня: {completedToday}</Badge>
                            <Badge variant="outline" className="rounded-full">Пиковая нагрузка: {ordersToday} заказов</Badge>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button asChild variant="outline">
                            <Link href="/orders">Открыть заказы</Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href="/inventory">Склад</Link>
                        </Button>
                        <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button>Создать заказ</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Быстрый заказ</DialogTitle>
                                    <DialogDescription>
                                        Добавьте имя клиента, контакт и сумму — заказ сразу появится в воронке.
                                    </DialogDescription>
                                </DialogHeader>

                                <form className="space-y-4" onSubmit={submitOrder}>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="customer_name">Имя клиента</Label>
                                            <Input
                                                id="customer_name"
                                                value={orderForm.data.customer_name}
                                                onChange={(event) =>
                                                    orderForm.setData('customer_name', event.target.value)
                                                }
                                                placeholder="Без имени"
                                            />
                                            {orderForm.errors.customer_name && (
                                                <p className="text-xs text-destructive">{orderForm.errors.customer_name}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="customer_phone">Телефон</Label>
                                            <Input
                                                id="customer_phone"
                                                value={orderForm.data.customer_phone}
                                                onChange={(event) =>
                                                    orderForm.setData('customer_phone', event.target.value)
                                                }
                                                placeholder="+7 (999) 000-00-00"
                                            />
                                            {orderForm.errors.customer_phone && (
                                                <p className="text-xs text-destructive">{orderForm.errors.customer_phone}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="delivery_type">Тип доставки</Label>
                                            <select
                                                id="delivery_type"
                                                className="w-full rounded-md border px-3 py-2 text-sm"
                                                value={orderForm.data.delivery_type}
                                                onChange={(event) => orderForm.setData('delivery_type', event.target.value)}
                                            >
                                                <option value="pickup">Самовывоз</option>
                                                <option value="courier">Доставка</option>
                                                <option value="shipping">Отправка</option>
                                            </select>
                                            {orderForm.errors.delivery_type && (
                                                <p className="text-xs text-destructive">{orderForm.errors.delivery_type}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="total">Сумма</Label>
                                            <Input
                                                id="total"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={orderForm.data.total}
                                                onChange={(event) => orderForm.setData('total', event.target.value)}
                                                required
                                            />
                                            {orderForm.errors.total && (
                                                <p className="text-xs text-destructive">{orderForm.errors.total}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Комментарий</Label>
                                        <textarea
                                            id="notes"
                                            className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
                                            value={orderForm.data.notes}
                                            onChange={(event) => orderForm.setData('notes', event.target.value)}
                                            placeholder="Описание состава, пожелания, детали доставки"
                                        />
                                        {orderForm.errors.notes && (
                                            <p className="text-xs text-destructive">{orderForm.errors.notes}</p>
                                        )}
                                    </div>

                                    <DialogFooter className="gap-2 sm:gap-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCreateModalOpen(false)}
                                            className="sm:mr-auto"
                                        >
                                            Отмена
                                        </Button>
                                        <Button type="submit" disabled={orderForm.processing} className="gap-2">
                                            <ClipboardList className="h-4 w-4" />
                                            Добавить заказ
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                

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
                    <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Живой борд заказов</CardTitle>
                            <CardDescription>Карточки можно переводить по статусам — как в CRM</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="rounded-full">Активных: {formatNumber(activeInProgress)}</Badge>
                            <Badge variant="secondary" className="rounded-full">Готовых к выдаче: {formatNumber(readyToHandOff)}</Badge>
                            <Button asChild variant="ghost" size="sm" className="gap-2">
                                <Link href="/orders">
                                    Управлять списком
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto px-1 sm:px-3">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                            {boardColumns.map((column) => (
                                <div key={column.status} className="flex h-full flex-col gap-3 rounded-xl border bg-muted/20 p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="rounded-full">
                                                    {statusLabels[column.status] ?? column.status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {statusHints[column.status] ?? 'Статус из заказов'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{formatNumber(pipelineTotals[column.status] ?? 0)} в колонке</p>
                                        </div>
                                        <Badge variant="secondary">{column.orders.length}</Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {column.orders.length === 0 && (
                                            <p className="text-xs text-muted-foreground">Нет карточек в этом статусе.</p>
                                        )}

                                        {column.orders.map((order) => {
                                            const next = getNextStatus(order.status as PipelineStatus);
                                            const actionLabel = statusActions[order.status] ?? 'Обновить статус';

                                            return (
                                                <div
                                                    key={order.id}
                                                    className="space-y-3 rounded-lg border bg-background p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-semibold">#{order.id}</p>
                                                            <p className="text-xs text-muted-foreground">{order.customer ?? 'Без имени'}</p>
                                                        </div>
                                                        <Badge variant="outline">{formatCurrency(order.total)}</Badge>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1 text-secondary-foreground">
                                                            <Truck className="h-3 w-3" />
                                                            {deliveryLabels[order.delivery_type] ?? order.delivery_type}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-1 text-secondary-foreground">
                                                            <Timer className="h-3 w-3" />
                                                            {order.delivery_time ?? new Date(order.created_at).toLocaleTimeString('ru-RU')}
                                                        </span>
                                                        <Badge variant={order.payment_status === 'paid' ? 'secondary' : 'outline'}>
                                                            {order.payment_status === 'paid'
                                                                ? 'Оплата получена'
                                                                : `Оплачено ${formatCurrency(order.paid_total)}`}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="text-xs text-muted-foreground">
                                                            {statusLabels[order.status] ?? order.status}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant={next ? 'default' : 'outline'}
                                                                className="gap-2"
                                                                disabled={!next}
                                                                onClick={() =>
                                                                    handleAdvanceStatus(
                                                                        order.id,
                                                                        order.status as PipelineStatus,
                                                                    )
                                                                }
                                                            >
                                                                <ClipboardList className="h-4 w-4" />
                                                                {next ? actionLabel : 'Финальный статус'}
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                disabled={!next}
                                                                onClick={() =>
                                                                    handleAdvanceStatus(
                                                                        order.id,
                                                                        order.status as PipelineStatus,
                                                                    )
                                                                }
                                                                aria-label="Продвинуть заказ"
                                                            >
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
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
