import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/shared';
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ReportsProps extends PageProps {
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
    { title: 'Отчёты', href: '/reports' },
];

const statusFlow: PipelineStatus[] = ['draft', 'confirmed', 'in_assembly', 'ready', 'delivered'];

const statusLabels: Record<string, string> = {
    draft: 'Черновик',
    confirmed: 'Подтверждён',
    in_assembly: 'Сборка',
    ready: 'Готов',
    delivered: 'Доставлен',
    canceled: 'Отменён',
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

export default function Reports({ auth, orders, inventory, paymentsToday, ordersToday, completedToday }: ReportsProps) {
    const [orderCards] = useState<OrderResource[]>(orders);

    const summaryCards = [
        {
            title: 'Выручка сегодня',
            value: formatCurrency(paymentsToday),
            description: `${ordersToday} заказов за день`,
            icon: TrendingUp,
        },
        {
            title: 'Активные заказы',
            value: orderCards.filter((order) => !['delivered', 'canceled'].includes(order.status)).length,
            description: 'Всё, что ещё нужно довести до клиента',
            icon: BarChart3,
        },
        {
            title: 'Партии на складе',
            value: inventory.length,
            description: 'Отсортированы по сроку годности',
            icon: PieChart,
        },
    ];

    const revenueSeries = useMemo(() => {
        const today = new Date();

        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - index));
            const dayKey = date.toISOString().slice(0, 10);

            const dayOrders = orderCards.filter((order) => {
                const orderDate = new Date(order.created_at);
                return orderDate.toISOString().slice(0, 10) === dayKey;
            });

            const revenue = dayOrders.reduce((total, order) => total + order.total, 0);

            return {
                label: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
                value: revenue,
                orders: dayOrders.length,
            };
        });
    }, [orderCards]);

    const statusBreakdown = useMemo(() => {
        const totals: Record<PipelineStatus, number> = {};

        orderCards.forEach((order) => {
            const status = order.status as PipelineStatus;
            totals[status] = (totals[status] ?? 0) + 1;
        });

        const overall = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;

        return Object.entries(totals)
            .map(([key, value]) => ({
                status: key as PipelineStatus,
                total: value,
                percent: Math.round((value / overall) * 100),
            }))
            .sort((a, b) => (statusFlow.indexOf(a.status) - statusFlow.indexOf(b.status)) || a.status.localeCompare(b.status));
    }, [orderCards]);

    const deliveryMix = useMemo(() => {
        const totals: Record<string, number> = { pickup: 0, courier: 0, shipping: 0 };

        orderCards.forEach((order) => {
            totals[order.delivery_type] = (totals[order.delivery_type] ?? 0) + 1;
        });

        const overall = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;

        return Object.entries(totals).map(([type, count]) => ({
            type,
            count,
            percent: Math.round((count / overall) * 100),
        }));
    }, [orderCards]);

    const maxRevenue = Math.max(...revenueSeries.map((item) => item.value), 1);
    const peakRevenue = Math.max(...revenueSeries.map((item) => item.value), 0);
    const averageRevenue = Math.round(revenueSeries.reduce((sum, item) => sum + item.value, 0) / revenueSeries.length);
    const totalOrdersWeek = revenueSeries.reduce((sum, item) => sum + item.orders, 0);
    const pickupAngle = ((deliveryMix[0]?.percent ?? 0) / 100) * 360;
    const courierAngle = pickupAngle + ((deliveryMix[1]?.percent ?? 0) / 100) * 360;

    return (
        <AppLayout user={auth.user} breadcrumbs={breadcrumbs}>
            <Head title="Отчёты" />

            <div className="space-y-6 px-4 pb-8 sm:px-6 lg:px-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        <Badge variant="secondary" className="rounded-full">Reports</Badge>
                        Подборка ключевых метрик
                    </div>
                    <h1 className="text-3xl font-semibold leading-tight">Раздел отчётов</h1>
                    <p className="max-w-3xl text-sm text-muted-foreground">
                        Чистая страница для визуализаций: тренд выручки, прохождение по воронке и распределение доставок.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="rounded-full">Закрыто сегодня: {completedToday}</Badge>
                        <Badge variant="secondary" className="rounded-full">Пиковая нагрузка: {ordersToday} заказов</Badge>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {summaryCards.map((card) => (
                        <Card key={card.title} className="border-border/80">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-2">
                                    <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
                                    <div className="text-2xl font-semibold">{card.value}</div>
                                    <CardDescription>{card.description}</CardDescription>
                                </div>
                                <card.icon className="h-8 w-8 text-primary/70" />
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border-border/80 lg:col-span-2">
                        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <LineChart className="h-4 w-4 text-primary" /> Динамика выручки за 7 дней
                                </CardTitle>
                                <CardDescription>Показывает, как менялись платежи и количество заказов</CardDescription>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                                    Среднее: {formatCurrency(averageRevenue)}
                                </div>
                                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400">
                                    Завершено сегодня: {completedToday}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative h-48 rounded-lg border bg-gradient-to-br from-primary/5 via-primary/0 to-primary/10 p-4">
                                <svg viewBox="0 0 100 100" className="h-full w-full">
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgb(59 130 246 / 0.25)" />
                                            <stop offset="100%" stopColor="rgb(59 130 246 / 0.02)" />
                                        </linearGradient>
                                    </defs>
                                    {revenueSeries.length > 1 && (
                                        <>
                                            <path
                                                d={`M0,100 L${revenueSeries
                                                    .map((item, index) => {
                                                        const x = (index / (revenueSeries.length - 1)) * 100;
                                                        const y =
                                                            100 -
                                                            (revenueSeries[index].value / maxRevenue) * 90;

                                                        return `${x},${y}`;
                                                    })
                                                    .join(' ')} L100,100 Z`}
                                                fill="url(#revenueGradient)"
                                                stroke="none"
                                            />
                                            <polyline
                                                points={revenueSeries
                                                    .map((item, index) => {
                                                        const x = (index / (revenueSeries.length - 1)) * 100;
                                                        const y = 100 - (item.value / maxRevenue) * 90;

                                                        return `${x},${y}`;
                                                    })
                                                    .join(' ')}
                                                fill="none"
                                                stroke="rgb(59 130 246)"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            {revenueSeries.map((item, index) => {
                                                const x = (index / (revenueSeries.length - 1)) * 100;
                                                const y = 100 - (item.value / maxRevenue) * 90;

                                                return <circle key={item.label} cx={x} cy={y} r={1.6} fill="rgb(59 130 246)" />;
                                            })}
                                        </>
                                    )}
                                    <g className="text-[8px] fill-muted-foreground">
                                        {revenueSeries.map((item, index) => {
                                            const x = (index / (revenueSeries.length - 1)) * 100;

                                            return (
                                                <text key={item.label} x={x} y={98} textAnchor="middle">
                                                    {item.label}
                                                </text>
                                            );
                                        })}
                                    </g>
                                </svg>
                                <div className="absolute right-4 top-4 flex items-center gap-3 rounded-lg bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
                                    <div className="flex flex-col text-xs text-muted-foreground">
                                        <span>Заказы</span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {totalOrdersWeek} за 7 дней
                                        </span>
                                    </div>
                                    <span className="h-8 w-px bg-border" />
                                    <div className="flex flex-col text-xs text-muted-foreground">
                                        <span>Пик</span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {formatCurrency(peakRevenue)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <BarChart3 className="h-4 w-4 text-primary" /> Статусы заказов
                            </CardTitle>
                            <CardDescription>Визуализация прохождения по воронке</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {statusBreakdown.map((item) => (
                                <div key={item.status} className="rounded-lg border bg-muted/40 p-3">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                                            {statusLabels[item.status] ?? item.status}
                                        </div>
                                        <span className="text-muted-foreground">{item.percent}%</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{ width: `${item.percent}%` }}
                                            />
                                        </div>
                                        <Badge variant="outline" className="rounded-full">
                                            {item.total}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/80">
                    <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <PieChart className="h-4 w-4 text-primary" /> Способы доставки
                            </CardTitle>
                            <CardDescription>Соотношение самовывоза, курьеров и отправок</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="rounded-full">
                                {formatNumber(orderCards.length)} заказов
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                                Обновлено сегодня
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-[1.4fr,1fr] md:items-center">
                        <div className="relative mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-primary/5 via-primary/0 to-primary/10 p-8">
                            <div className="relative h-full w-full rounded-full bg-muted/30">
                                <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full rotate-[-90deg]">
                                    <circle
                                        cx="16"
                                        cy="16"
                                        r="14"
                                        fill="transparent"
                                        stroke="rgb(59 130 246 / 0.25)"
                                        strokeWidth="6"
                                        strokeDasharray={`${(pickupAngle / 360) * 88} 88`}
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx="16"
                                        cy="16"
                                        r="14"
                                        fill="transparent"
                                        stroke="rgb(16 185 129 / 0.4)"
                                        strokeWidth="6"
                                        strokeDasharray={`${((deliveryMix[1]?.percent ?? 0) / 100) * 88} 88`}
                                        strokeDashoffset={`${(pickupAngle / 360) * 88}`}
                                        strokeLinecap="round"
                                    />
                                    <circle
                                        cx="16"
                                        cy="16"
                                        r="14"
                                        fill="transparent"
                                        stroke="rgb(234 179 8 / 0.6)"
                                        strokeWidth="6"
                                        strokeDasharray={`${((deliveryMix[2]?.percent ?? 0) / 100) * 88} 88`}
                                        strokeDashoffset={`${(courierAngle / 360) * 88}`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-6 rounded-full bg-background" />
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <div className="text-sm text-muted-foreground">Суммарно</div>
                                <div className="text-2xl font-semibold">{formatNumber(orderCards.length)}</div>
                                <div className="text-xs text-muted-foreground">за последние дни</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {deliveryMix.map((item, index) => (
                                <div
                                    key={item.type}
                                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="h-3 w-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    index === 0
                                                        ? 'rgb(59 130 246)'
                                                        : index === 1
                                                          ? 'rgb(16 185 129)'
                                                          : 'rgb(234 179 8)',
                                            }}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold">{deliveryLabels[item.type] ?? item.type}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatNumber(item.count)} · {item.percent}%
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="rounded-full">
                                        {item.percent}%
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
